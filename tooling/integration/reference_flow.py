from __future__ import annotations

from typing import Any

from tooling.integration.runtime import (
    DomainEvent,
    IntegrationRuntime,
    order_confirmed_to_erp_command,
)
from tooling.integration.reconciliation import reconcile


def run_medusa_to_tryton_reference(
    *,
    runtime: IntegrationRuntime,
    medusa_order: dict[str, Any],
    tryton_reader,
) -> dict[str, Any]:
    order_id = str(medusa_order["id"])
    event = DomainEvent(
        event_id=f"evt-medusa-{order_id}",
        event_type="order.confirmed",
        producer="medusa",
        aggregate_type="order",
        aggregate_id=order_id,
        payload={
            "total": medusa_order["total"],
            "currency": medusa_order.get("currency", "INR"),
            "customer_id": medusa_order.get("customer_id"),
        },
        idempotency_key=f"medusa-order:{order_id}:confirmed",
    )

    command = order_confirmed_to_erp_command(event)
    delivery = runtime.dispatch(command)

    target = tryton_reader(order_id)
    record = reconcile(
        record_id=f"rec-{order_id}",
        flow="commerce-order-to-erp",
        source="commerce",
        target="erp",
        entity_type="order",
        entity_id=order_id,
        source_state={
            "external_id": order_id,
            "status": "confirmed",
            "total": medusa_order["total"],
        },
        target_state=target,
        compare_fields=["external_id", "status", "total"],
    )

    return {
        "event": event,
        "command": command,
        "delivery": delivery,
        "reconciliation": record,
    }
