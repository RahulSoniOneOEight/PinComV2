import hashlib
import hmac
import unittest

from tooling.integration.adapters import ProviderConfig
from tooling.integration.connector_adapters import (
    cashfree_adapter,
    delhivery_adapter,
    razorpay_adapter,
    shiprocket_adapter,
    whatsapp_adapter,
)
from tooling.integration.reference_flow import run_medusa_to_tryton_reference
from tooling.integration.runtime import (
    DeliveryResult,
    DomainCommand,
    IntegrationRuntime,
)
from tooling.integration.signatures import verify_razorpay_signature
from tooling.integration.scheduler import ReconciliationJob, ReconciliationScheduler
from tooling.integration.http_transport import command_endpoint


def ok_transport(config, command):
    return {"success": True, "external_id": f"{config.provider}-1"}


class TrytonStub:
    provider = "tryton"

    def execute(self, command):
        return DeliveryResult(
            success=True,
            provider=self.provider,
            command_id=command.command_id,
            attempt=1,
            external_id="TRY-1",
        )


class ProductionConnectorTests(unittest.TestCase):
    def test_connector_factories(self):
        factories = [
            ("razorpay", razorpay_adapter),
            ("cashfree", cashfree_adapter),
            ("shiprocket", shiprocket_adapter),
            ("delhivery", delhivery_adapter),
            ("meta-whatsapp-cloud", whatsapp_adapter),
        ]
        command = DomainCommand(
            command_id="cmd-1",
            command_type="test",
            target="x",
            payload={},
            idempotency_key="k1",
        )
        for provider, factory in factories:
            adapter = factory(
                ProviderConfig(provider=provider, base_url="http://example.invalid"),
                ok_transport,
            )
            self.assertTrue(adapter.execute(command).success)

    def test_razorpay_signature(self):
        secret = "secret"
        body = b'{"id":"pay_1"}'
        signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        self.assertTrue(
            verify_razorpay_signature(
                secret=secret,
                body=body,
                supplied_signature=signature,
            )
        )

    def test_reference_medusa_to_tryton_flow(self):
        runtime = IntegrationRuntime()
        runtime.register("erp", TrytonStub())

        def reader(order_id):
            return {
                "external_id": order_id,
                "status": "confirmed",
                "total": 1999,
            }

        result = run_medusa_to_tryton_reference(
            runtime=runtime,
            medusa_order={
                "id": "ORD-1",
                "total": 1999,
                "currency": "INR",
                "customer_id": "CUST-1",
            },
            tryton_reader=reader,
        )
        self.assertTrue(result["delivery"].success)
        self.assertEqual(result["reconciliation"]["status"], "matched")

    def test_connector_http_endpoint_mappings(self):
        self.assertEqual(command_endpoint("payments.create_order"), "/payments/orders")
        self.assertEqual(command_endpoint("logistics.create_shipment"), "/shipments")
        self.assertEqual(command_endpoint("messaging.send_whatsapp"), "/messages")

    def test_reconciliation_scheduler(self):
        scheduler = ReconciliationScheduler()
        scheduler.register(
            ReconciliationJob(
                job_id="orders",
                flow="commerce-order-to-erp",
                interval_minutes=15,
            )
        )
        results = scheduler.run_enabled(lambda job: {"status": "ok"})
        self.assertEqual(results[0]["flow"], "commerce-order-to-erp")


if __name__ == "__main__":
    unittest.main()
