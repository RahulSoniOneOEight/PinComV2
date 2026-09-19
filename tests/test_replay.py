import shutil
from pathlib import Path
import tempfile
import unittest

from tooling.integration.dead_letter import make_dead_letter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.replay import ReplayAuthorizationError, replay_dead_letter
from tooling.integration.runtime import DeliveryResult


class SuccessAdapter:
    provider = "erp"

    def __init__(self):
        self.calls = 0

    def execute(self, command):
        self.calls += 1
        return DeliveryResult(
            success=True,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            external_id="EXT-REPLAY",
        )


class FailingAdapter:
    provider = "erp"

    def __init__(self):
        self.calls = 0

    def execute(self, command):
        self.calls += 1
        return DeliveryResult(
            success=False,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            error="still-down",
        )


def dead_letter() -> dict:
    return make_dead_letter(
        dead_letter_id="DLQ-cmd-1",
        kind="command",
        payload={
            "command_id": "cmd-1",
            "command_type": "erp.create_sales_order",
            "target": "erp",
            "payload": {"order_id": "ORD-1"},
            "idempotency_key": "erp-order:ORD-1",
            "correlation_id": "corr-1",
        },
        reason="downstream-unavailable",
        attempts=3,
    )


class ReplayLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        # LIFO cleanup: the store closes before the directory is removed.
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

    def _runtime(self, adapter) -> ProductionIntegrationRuntime:
        store = SQLiteRuntimeStore(Path(self.tmp) / "runtime.db")
        self.addCleanup(store.close)
        runtime = ProductionIntegrationRuntime(store, sleep=lambda _: None)
        runtime.register("erp", adapter)
        return runtime

    def test_successful_replay_marks_replayed(self):
        runtime = self._runtime(SuccessAdapter())
        letter = dead_letter()
        runtime.store.put_dead_letter(letter)

        result = replay_dead_letter(
            runtime=runtime, dead_letter=letter, authorized_by="ops-user"
        )

        self.assertTrue(result.success)
        stored = runtime.store.get_dead_letter("DLQ-cmd-1")
        self.assertEqual(stored["status"], "replayed")
        self.assertEqual(stored["replay"]["authorized_by"], "ops-user")
        self.assertEqual(stored["replay"]["command_id"], "cmd-1-replay")
        self.assertEqual(stored["replay"]["external_id"], "EXT-REPLAY")
        self.assertIn("at", stored["replay"])

    def test_failed_replay_stays_open_with_failure_recorded(self):
        runtime = self._runtime(FailingAdapter())
        letter = dead_letter()
        runtime.store.put_dead_letter(letter)

        result = replay_dead_letter(
            runtime=runtime, dead_letter=letter, authorized_by="ops-user"
        )

        self.assertFalse(result.success)
        stored = runtime.store.get_dead_letter("DLQ-cmd-1")
        self.assertEqual(stored["status"], "open")
        self.assertFalse(stored["replay"]["success"])
        self.assertEqual(stored["replay"]["error"], "still-down")

    def test_replay_requires_authorization(self):
        runtime = self._runtime(SuccessAdapter())
        with self.assertRaises(ReplayAuthorizationError):
            replay_dead_letter(
                runtime=runtime, dead_letter=dead_letter(), authorized_by=None
            )

    def test_only_command_dead_letters_are_replayable(self):
        runtime = self._runtime(SuccessAdapter())
        letter = dead_letter()
        letter["kind"] = "event"
        with self.assertRaises(ValueError):
            replay_dead_letter(
                runtime=runtime, dead_letter=letter, authorized_by="ops-user"
            )


if __name__ == "__main__":
    unittest.main()
