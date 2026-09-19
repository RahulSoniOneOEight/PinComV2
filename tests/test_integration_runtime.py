import threading
import time
import unittest

from tooling.integration.runtime import (
    DeliveryResult,
    DomainCommand,
    DomainEvent,
    IntegrationRuntime,
    order_confirmed_to_erp_command,
)
from tooling.integration.reconciliation import reconcile


class StubAdapter:
    provider = "stub"

    def __init__(self, fail_first: bool = False):
        self.fail_first = fail_first
        self.calls = 0

    def execute(self, command: DomainCommand) -> DeliveryResult:
        self.calls += 1
        if self.fail_first and self.calls == 1:
            return DeliveryResult(
                success=False,
                provider=self.provider,
                command_id=command.command_id,
                attempt=self.calls,
                error="temporary",
            )
        return DeliveryResult(
            success=True,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            external_id="EXT-1",
        )


class SlowAdapter(StubAdapter):
    def __init__(self, delay: float = 0.05):
        super().__init__()
        self.delay = delay

    def execute(self, command: DomainCommand) -> DeliveryResult:
        time.sleep(self.delay)
        return super().execute(command)


def command(key: str = "k1", **overrides) -> DomainCommand:
    values = {
        "command_id": "cmd-1",
        "command_type": "erp.create_sales_order",
        "target": "erp",
        "payload": {},
        "idempotency_key": key,
    }
    values.update(overrides)
    return DomainCommand(**values)


class IntegrationRuntimeTests(unittest.TestCase):
    def test_order_event_maps_to_erp_command(self):
        event = DomainEvent(
            event_id="evt-1",
            event_type="order.confirmed",
            producer="commerce",
            aggregate_type="order",
            aggregate_id="ORD-1",
            payload={"total": 1000},
            idempotency_key="evt:ORD-1",
        )
        mapped = order_confirmed_to_erp_command(event)
        self.assertEqual(mapped.command_type, "erp.create_sales_order")
        self.assertEqual(mapped.payload["order_id"], "ORD-1")

    def test_retry_then_success(self):
        runtime = IntegrationRuntime(sleep=lambda _: None)
        adapter = StubAdapter(fail_first=True)
        runtime.register("erp", adapter)
        result = runtime.dispatch(command())
        self.assertTrue(result.success)
        self.assertEqual(adapter.calls, 2)

    def test_backoff_is_honored_between_attempts(self):
        delays: list[float] = []
        runtime = IntegrationRuntime(sleep=delays.append)
        adapter = StubAdapter(fail_first=True)
        runtime.register("erp", adapter)
        runtime.dispatch(command(backoff_seconds=7))
        self.assertEqual(delays, [7])

    def test_idempotent_replay_does_not_redeliver(self):
        runtime = IntegrationRuntime(sleep=lambda _: None)
        adapter = StubAdapter()
        runtime.register("erp", adapter)
        cmd = command(key="same")
        runtime.dispatch(cmd)
        runtime.dispatch(cmd)
        self.assertEqual(adapter.calls, 1)

    def test_concurrent_dispatch_executes_once(self):
        runtime = IntegrationRuntime(sleep=lambda _: None)
        adapter = SlowAdapter()
        runtime.register("erp", adapter)
        cmd = command(key="concurrent")
        barrier = threading.Barrier(4)
        results: list[DeliveryResult] = []
        lock = threading.Lock()

        def worker():
            barrier.wait()
            result = runtime.dispatch(cmd)
            with lock:
                results.append(result)

        threads = [threading.Thread(target=worker) for _ in range(4)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        self.assertEqual(adapter.calls, 1)
        self.assertEqual(sum(1 for r in results if r.success), 1)
        self.assertEqual(sum(1 for r in results if r.pending), 3)

    def test_reconciliation_detects_difference(self):
        record = reconcile(
            record_id="rec-1",
            flow="commerce-order-to-erp",
            source="commerce",
            target="erp",
            entity_type="order",
            entity_id="ORD-1",
            source_state={"status": "confirmed", "total": 1000},
            target_state={"status": "draft", "total": 1000},
            compare_fields=["status", "total"],
        )
        self.assertEqual(record["status"], "mismatch")
        self.assertIn("status", record["difference"])


if __name__ == "__main__":
    unittest.main()
