import asyncio
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from tooling.integration import consumer
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.runtime import DeliveryResult


def valid_event():
    return {
        "event_id": "evt-1",
        "event_type": "order.created",
        "version": 1,
        "source_system": "medusa",
        "tenant_id": "reference-retail",
        "entity_id": "order_1",
        "correlation_id": "corr-1",
        "occurred_at": "2026-09-22T00:00:00Z",
        "payload": {"currency": "EUR", "total": 10},
    }


class FakeMessage:
    def __init__(self, data: bytes):
        self.data = data
        self.acked = False
        self.termed = False

    async def ack(self):
        self.acked = True

    async def term(self):
        self.termed = True


class FakeSubscription:
    def __init__(self, messages):
        self._batches = [messages]

    async def fetch(self, batch, timeout=None):
        return self._batches.pop(0) if self._batches else []


class FakeJetStream:
    def __init__(self, messages):
        self._messages = messages

    async def add_stream(self, **kwargs):
        return None

    async def stream_info(self, name):
        return {"config": {"name": name}}

    async def pull_subscribe(self, subject, durable=None, stream=None):
        return FakeSubscription(self._messages)

    async def publish(self, subject, payload, headers=None):
        return type("Ack", (), {"stream": "PINCOMMERCE", "seq": 1})()


class FakeNC:
    def __init__(self, messages):
        self._js = FakeJetStream(messages)

    def jetstream(self):
        return self._js


class FakeAdapter:
    provider = "tryton"

    def __init__(self, fail=False):
        self.fail = fail
        self.calls = 0

    def execute(self, command):
        self.calls += 1
        return DeliveryResult(
            success=not self.fail,
            provider=self.provider,
            command_id=command.command_id,
            attempt=self.calls,
            external_id=None if self.fail else "SALE-1",
            error="tryton-unavailable" if self.fail else None,
        )


def run_consume(messages, *, fail=False, tmp):
    created = []

    async def fake_connect(url):
        return FakeNC(messages)

    async def fake_close(nc):
        return None

    def fake_runtime(store_path, base_url, token):
        runtime = ProductionIntegrationRuntime(
            SQLiteRuntimeStore(store_path), sleep=lambda _: None
        )
        runtime.register("erp", FakeAdapter(fail=fail))
        created.append(runtime)
        return runtime

    try:
        with mock.patch.object(consumer, "connect_nats", fake_connect), \
            mock.patch.object(consumer, "close_nats", fake_close), \
            mock.patch.object(consumer, "_runtime", fake_runtime):
            return asyncio.run(
                consumer.consume(
                    store_path=Path(tmp) / "runtime.db",
                    base_url="http://tryton.test",
                    token="admin:secret",
                    nats_url="nats://test",
                    max_messages=1,
                    timeout=5,
                    ack=True,
                )
            )
    finally:
        for runtime in created:
            runtime.store.close()


class ConsumerTests(unittest.TestCase):
    def test_valid_event_is_dispatched_and_acked(self):
        message = FakeMessage(json.dumps(valid_event()).encode())
        with tempfile.TemporaryDirectory() as tmp:
            results = run_consume([message], tmp=tmp)
        self.assertEqual(results[0]["status"], "completed")
        self.assertEqual(results[0]["external_id"], "SALE-1")
        self.assertTrue(message.acked)

    def test_invalid_event_is_termed(self):
        bad = valid_event()
        del bad["tenant_id"]
        message = FakeMessage(json.dumps(bad).encode())
        with tempfile.TemporaryDirectory() as tmp:
            results = run_consume([message], tmp=tmp)
        self.assertEqual(results[0]["status"], "invalid")
        self.assertTrue(message.termed)

    def test_failure_creates_dead_letter(self):
        message = FakeMessage(json.dumps(valid_event()).encode())
        with tempfile.TemporaryDirectory() as tmp:
            results = run_consume([message], fail=True, tmp=tmp)
            self.assertEqual(results[0]["status"], "failed")
            self.assertTrue(message.acked)
            with SQLiteRuntimeStore(Path(tmp) / "runtime.db") as store:
                self.assertEqual(len(store.list_dead_letters()), 1)


if __name__ == "__main__":
    unittest.main()
