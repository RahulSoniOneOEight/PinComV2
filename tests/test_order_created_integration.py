from pathlib import Path
import tempfile
from typing import Any
import unittest

import yaml

from tooling.integration.adapters import ProviderConfig, tryton_adapter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.order_created import (
    OrderCreatedError,
    handle_order_created,
    order_created_to_erp_command,
    validate_order_created,
)
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.runtime import IntegrationRuntime

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "templates" / "order-created.v1.yaml"


def order_created(event_id="evt-1", entity_id="order_1001", **overrides):
    value = {
        "event_id": event_id,
        "event_type": "order.created",
        "version": 1,
        "source_system": "medusa",
        "tenant_id": "reference-retail",
        "entity_id": entity_id,
        "correlation_id": "corr-1",
        "occurred_at": "2026-09-22T00:00:00Z",
        "payload": {"currency": "INR", "total": 2499},
    }
    value.update(overrides)
    return value


class RecordingTransport:
    """Stands in for Tryton and records one sales order per successful call."""

    def __init__(self, fail: bool = False):
        self.calls: list[str] = []
        self.fail = fail

    def __call__(self, config, command):
        self.calls.append(command.command_id)
        if self.fail:
            return {"success": False, "error": "tryton-unavailable"}
        return {"success": True, "external_id": f"SO-{len(self.calls)}"}


def build_runtime(transport, store=None, sleep=lambda _: None) -> Any:
    if store is not None:
        runtime = ProductionIntegrationRuntime(store, sleep=sleep)
    else:
        runtime = IntegrationRuntime(sleep=sleep)
    config = ProviderConfig(provider="tryton", base_url="http://tryton.test")
    runtime.register("erp", tryton_adapter(config, transport))
    return runtime


class OrderCreatedContractTests(unittest.TestCase):
    def test_template_is_valid(self):
        with TEMPLATE.open("r", encoding="utf-8") as fh:
            document = yaml.safe_load(fh)
        self.assertEqual(validate_order_created(document), [])

    def test_missing_required_field_is_rejected(self):
        document = order_created()
        del document["tenant_id"]
        self.assertTrue(validate_order_created(document))

    def test_wrong_event_type_and_version_are_rejected(self):
        self.assertTrue(validate_order_created(order_created(event_type="order.confirmed")))
        self.assertTrue(validate_order_created(order_created(version=2)))

    def test_maps_to_erp_command_with_entity_scoped_idempotency(self):
        command = order_created_to_erp_command(order_created())
        self.assertEqual(command.command_type, "erp.create_sales_order")
        self.assertEqual(command.target, "erp")
        self.assertEqual(command.idempotency_key, "erp-order:reference-retail:order_1001")
        self.assertEqual(command.payload["order_id"], "order_1001")


class OrderCreatedIntegrationTests(unittest.TestCase):
    def test_duplicate_event_creates_single_record(self):
        transport = RecordingTransport()
        runtime = build_runtime(transport)

        first = handle_order_created(order_created(), runtime)
        duplicate = handle_order_created(order_created(), runtime)
        # A different event id for the same order is still the same entity.
        other_event = handle_order_created(order_created(event_id="evt-2"), runtime)

        self.assertTrue(first["delivery"].success)
        self.assertEqual(transport.calls, [first["command"].command_id])
        self.assertEqual(duplicate["delivery"].external_id, first["delivery"].external_id)
        self.assertEqual(other_event["delivery"].external_id, first["delivery"].external_id)

    def test_failure_is_observable(self):
        with tempfile.TemporaryDirectory() as tmp:
            with SQLiteRuntimeStore(Path(tmp) / "runtime.db") as store:
                transport = RecordingTransport(fail=True)
                runtime = build_runtime(transport, store=store)

                result = handle_order_created(order_created(), runtime)

                self.assertFalse(result["delivery"].success)
                self.assertFalse(result["audit"]["success"])
                self.assertEqual(
                    result["audit"]["event"], "integration.order_created_handled"
                )

                dead_letters = runtime.delivery_exceptions()
                self.assertEqual(len(dead_letters), 1)
                self.assertEqual(dead_letters[0]["status"], "open")

    def test_restart_does_not_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "runtime.db"

            with SQLiteRuntimeStore(db) as store1:
                transport1 = RecordingTransport()
                runtime1 = build_runtime(transport1, store=store1)
                first = handle_order_created(order_created(), runtime1)
                self.assertTrue(first["delivery"].success)
                self.assertEqual(len(transport1.calls), 1)

            with SQLiteRuntimeStore(db) as store2:
                transport2 = RecordingTransport()
                runtime2 = build_runtime(transport2, store=store2)
                replay = handle_order_created(order_created(), runtime2)
                self.assertTrue(replay["delivery"].success)
                self.assertEqual(transport2.calls, [])

    def test_invalid_event_is_rejected_before_dispatch(self):
        transport = RecordingTransport()
        runtime = build_runtime(transport)
        with self.assertRaises(OrderCreatedError):
            handle_order_created(order_created(version=99), runtime)
        self.assertEqual(transport.calls, [])


if __name__ == "__main__":
    unittest.main()
