import asyncio
from pathlib import Path
import tempfile
import unittest

from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.nats_transport import publish_event
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.runtime import DeliveryResult, DomainCommand, DomainEvent
from tooling.integration.webhooks import canonicalize_webhook


class FailingAdapter:
    provider = "failing"

    def __init__(self):
        self.calls = 0

    def execute(self, command):
        self.calls += 1
        return DeliveryResult(
            success=False,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            error="downstream-unavailable",
        )


class SuccessAdapter:
    provider = "success"

    def __init__(self):
        self.calls = 0

    def execute(self, command):
        self.calls += 1
        return DeliveryResult(
            success=True,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            external_id="EXT-1",
        )


class FakeNATS:
    def __init__(self):
        self.messages = []

    async def publish(self, subject, payload):
        self.messages.append((subject, payload))


class IntegrationInfrastructureTests(unittest.TestCase):
    def test_durable_idempotency_survives_runtime_instance(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "runtime.db"
            command = DomainCommand(
                command_id="cmd-1",
                command_type="erp.create_sales_order",
                target="erp",
                payload={},
                idempotency_key="durable-1",
            )

            store1 = SQLiteRuntimeStore(db)
            runtime1 = ProductionIntegrationRuntime(store1)
            adapter1 = SuccessAdapter()
            runtime1.register("erp", adapter1)
            runtime1.dispatch(command)
            self.assertEqual(adapter1.calls, 1)

            store2 = SQLiteRuntimeStore(db)
            runtime2 = ProductionIntegrationRuntime(store2)
            adapter2 = SuccessAdapter()
            runtime2.register("erp", adapter2)
            result = runtime2.dispatch(command)
            self.assertTrue(result.success)
            self.assertEqual(adapter2.calls, 0)

    def test_failed_command_moves_to_dead_letter(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = SQLiteRuntimeStore(Path(tmp) / "runtime.db")
            runtime = ProductionIntegrationRuntime(store)
            runtime.register("erp", FailingAdapter())
            command = DomainCommand(
                command_id="cmd-fail",
                command_type="erp.create_sales_order",
                target="erp",
                payload={},
                idempotency_key="fail-1",
                max_attempts=2,
            )
            result = runtime.dispatch(command)
            self.assertFalse(result.success)
            letters = runtime.delivery_exceptions()
            self.assertEqual(len(letters), 1)
            self.assertEqual(letters[0]["status"], "open")
            self.assertEqual(letters[0]["attempts"], 2)

    def test_webhook_canonicalization(self):
        event = canonicalize_webhook(
            provider="medusa",
            webhook_type="order",
            payload={"id": "ORD-1", "total": 999},
        )
        self.assertEqual(event.event_type, "order.confirmed")
        self.assertEqual(event.aggregate_id, "ORD-1")

    def test_nats_subject_and_payload(self):
        event = DomainEvent(
            event_id="evt-1",
            event_type="order.confirmed",
            producer="commerce",
            aggregate_type="order",
            aggregate_id="ORD-1",
            payload={"total": 999},
            idempotency_key="evt-1",
        )
        client = FakeNATS()
        subject = asyncio.run(publish_event(client, event))
        self.assertEqual(subject, "pinaka.events.order.confirmed")
        self.assertEqual(len(client.messages), 1)


if __name__ == "__main__":
    unittest.main()
