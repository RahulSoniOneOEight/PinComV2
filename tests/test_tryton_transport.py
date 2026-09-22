import json
from pathlib import Path
import tempfile
import unittest
import urllib.error
from unittest import mock

from tooling.integration.adapters import ProviderConfig, tryton_adapter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.order_created import order_created_to_erp_command
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.providers.tryton import (
    TrytonError,
    tryton_sales_order_transport,
)

COMMAND_PAYLOAD = {
    "order_id": "order_1001",
    "tenant_id": "reference-retail",
    "source_system": "medusa",
    "event_id": "evt-1",
    "currency": "INR",
    "total": 2499,
    "customer_id": "cust_1001",
    "occurred_at": "2026-09-22T00:00:00Z",
}


def make_command(payload=None):
    event = {
        "event_id": "evt-1",
        "event_type": "order.created",
        "version": 1,
        "source_system": "medusa",
        "tenant_id": "reference-retail",
        "entity_id": "order_1001",
        "correlation_id": "corr-1",
        "occurred_at": "2026-09-22T00:00:00Z",
        "payload": {"currency": "INR", "total": 2499, "customer_id": "cust_1001"},
    }
    if payload:
        event["payload"].update(payload)
    return order_created_to_erp_command(event)


class FakeResponse:
    def __init__(self, payload: bytes):
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._payload


class FakeTryton:
    """Minimal in-memory Tryton JSON-RPC backend."""

    def __init__(self, *, login_ok=True, create_error=False, malformed=False, timeout=False):
        self.login_ok = login_ok
        self.create_error = create_error
        self.malformed = malformed
        self.timeout = timeout
        self.calls: list[str] = []
        self._next = 100
        self.tables: dict[str, list[dict]] = {
            "currency.currency": [],
            "company.company": [],
            "party.party": [],
            "product.uom": [{"id": 1, "name": "Unit"}],
            "product.product": [],
            "product.template": [],
            "sale.sale": [],
            "sale.line": [],
        }

    def _id(self):
        self._next += 1
        return self._next

    @staticmethod
    def _match(record, domain):
        for field, op, value in domain:
            if op != "=" or record.get(field) != value:
                return False
        return True

    def __call__(self, request, timeout=None):
        if self.timeout:
            raise urllib.error.URLError("timed out")
        body = json.loads(request.data.decode("utf-8"))
        method = body["method"]
        params = body["params"]
        self.calls.append(method)

        if method == "common.db.login":
            if not self.login_ok:
                return FakeResponse(
                    json.dumps({"id": 1, "error": ["LoginException", "bad"]}).encode()
                )
            return FakeResponse(json.dumps({"id": 1, "result": [1, "token", ""]}).encode())

        if self.malformed:
            return FakeResponse(b"<html>not json</html>")

        parts = method.split(".")
        model, action = ".".join(parts[1:-1]), parts[-1]
        table = self.tables.setdefault(model, [])

        if action == "search_read":
            domain, _offset, limit, _order, fields, _ctx = params
            rows = [r for r in table if self._match(r, domain)][:limit]
            return FakeResponse(
                json.dumps({"id": 1, "result": [
                    {"id": r["id"], **{f: r[f] for f in fields if f in r}} for r in rows
                ]}).encode()
            )
        if action == "create":
            values, _ctx = params
            created = []
            for value in values:
                record = {"id": self._id(), **value}
                table.append(record)
                created.append(record["id"])
            return FakeResponse(json.dumps({"id": 1, "result": created}).encode())
        if action == "default_get":
            return FakeResponse(json.dumps({"id": 1, "result": {
                "state": "draft",
                "invoice_method": "order",
                "shipment_method": "order",
                "invoice_state": "none",
                "shipment_state": "none",
            }}).encode())
        if action == "write":
            return FakeResponse(json.dumps({"id": 1, "result": None}).encode())
        raise AssertionError(f"unexpected method {method}")


def config():
    return ProviderConfig(
        provider="tryton", base_url="http://tryton.test", token="admin:secret"
    )


def run_transport(fake, command=None):
    with mock.patch("urllib.request.urlopen", fake):
        return tryton_sales_order_transport(config(), command or make_command())


class TrytonTransportTests(unittest.TestCase):
    def test_authentication_and_order_creation(self):
        fake = FakeTryton()
        result = run_transport(fake)
        self.assertTrue(result["success"])
        self.assertIn("common.db.login", fake.calls)
        self.assertIn("model.sale.sale.create", fake.calls)
        self.assertIn("model.sale.line.create", fake.calls)
        self.assertEqual(len(fake.tables["sale.sale"]), 1)
        self.assertEqual(len(fake.tables["sale.line"]), 1)

    def test_field_mapping(self):
        fake = FakeTryton()
        result = run_transport(fake)
        sale = fake.tables["sale.sale"][0]
        line = fake.tables["sale.line"][0]
        self.assertEqual(sale["reference"], "order_1001")
        self.assertEqual(sale["state"], "draft")
        self.assertIn("company", sale)
        self.assertIn("currency", sale)
        self.assertIn("party", sale)
        self.assertEqual(line["sale"], sale["id"])
        self.assertEqual(line["quantity"], 1)
        self.assertEqual(line["unit_price"], "2499")
        self.assertEqual(line["description"], "order_1001")
        self.assertEqual(line["type"], "line")
        self.assertEqual(result["external_id"], str(sale["id"]))

    def test_customer_party_resolved_from_payload(self):
        fake = FakeTryton()
        run_transport(fake)
        codes = [p["code"] for p in fake.tables["party.party"]]
        self.assertIn("cust_1001", codes)

    def test_duplicate_reference_returns_existing(self):
        fake = FakeTryton()
        fake.tables["sale.sale"].append({"id": 77, "reference": "order_1001"})
        result = run_transport(fake)
        self.assertTrue(result["success"])
        self.assertEqual(result["external_id"], "77")
        self.assertNotIn("model.sale.sale.create", fake.calls)

    def test_duplicate_transport_invocation_creates_once(self):
        fake = FakeTryton()
        run_transport(fake)
        run_transport(fake)
        self.assertEqual(fake.calls.count("model.sale.sale.create"), 1)

    def test_authentication_failure(self):
        fake = FakeTryton(login_ok=False)
        with self.assertRaises(TrytonError):
            run_transport(fake)

    def test_application_error_is_surfaced(self):
        fake = FakeTryton()
        original = fake.__call__

        def failing(request, timeout=None):
            body = json.loads(request.data.decode("utf-8"))
            if body["method"] == "model.sale.sale.create":
                return FakeResponse(
                    json.dumps({"id": 1, "error": ["UserError", "domain"]}).encode()
                )
            return original(request, timeout=timeout)

        with mock.patch("urllib.request.urlopen", failing):
            with self.assertRaises(TrytonError):
                tryton_sales_order_transport(config(), make_command())

    def test_transport_timeout(self):
        fake = FakeTryton(timeout=True)
        with self.assertRaises(TrytonError):
            run_transport(fake)

    def test_malformed_response(self):
        fake = FakeTryton(malformed=True)
        with self.assertRaises(TrytonError):
            run_transport(fake)


class TrytonRuntimeIntegrationTests(unittest.TestCase):
    def test_replay_returns_stored_result_without_transport_call(self):
        fake = FakeTryton()
        with tempfile.TemporaryDirectory() as tmp:
            with SQLiteRuntimeStore(Path(tmp) / "runtime.db") as store:
                runtime = ProductionIntegrationRuntime(store, sleep=lambda _: None)
                runtime.register("erp", tryton_adapter(config(), tryton_sales_order_transport))
                with mock.patch("urllib.request.urlopen", fake):
                    first = runtime.dispatch(make_command())
                    creates_after_first = fake.calls.count("model.sale.sale.create")
                    second = runtime.dispatch(make_command())
                self.assertTrue(first.success)
                self.assertEqual(second.external_id, first.external_id)
                self.assertEqual(fake.calls.count("model.sale.sale.create"), creates_after_first)


if __name__ == "__main__":
    unittest.main()
