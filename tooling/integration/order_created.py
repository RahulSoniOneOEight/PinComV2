from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import yaml

from tooling.contracts.validator import validate_document
from tooling.integration.adapters import ProviderConfig, tryton_adapter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.providers.tryton import tryton_sales_order_transport
from tooling.integration.runtime import DomainCommand, IntegrationRuntime

CONTRACT_TYPE = "order-created-v1"
EVENT_TYPE = "order.created"
CONTRACT_VERSION = 1

AUDIT_EVENT = "integration.order_created_handled"


class OrderCreatedError(ValueError):
    pass


def validate_order_created(event: dict[str, Any]) -> list[str]:
    """Validate an event against the order.created.v1 contract."""
    return validate_document(event, CONTRACT_TYPE)


def order_created_to_erp_command(event: dict[str, Any]) -> DomainCommand:
    """Map order.created.v1 to the provider-neutral ERP command.

    The idempotency key is derived from tenant + entity (the order), not the
    event id, so re-delivery of a duplicate event never creates a second ERP
    record for the same order.
    """
    if event.get("event_type") != EVENT_TYPE:
        raise OrderCreatedError(f"Expected {EVENT_TYPE} event")
    if event.get("version") != CONTRACT_VERSION:
        raise OrderCreatedError(f"Unsupported {EVENT_TYPE} version")

    entity_id = str(event["entity_id"])
    tenant_id = str(event["tenant_id"])
    return DomainCommand(
        command_id=f"cmd-{event['event_id']}-erp",
        command_type="erp.create_sales_order",
        target="erp",
        payload={
            "order_id": entity_id,
            "tenant_id": tenant_id,
            "source_system": event["source_system"],
            "event_id": event["event_id"],
            **event.get("payload", {}),
        },
        idempotency_key=f"erp-order:{tenant_id}:{entity_id}",
        correlation_id=event.get("correlation_id") or str(event["event_id"]),
    )


def _record_audit(runtime: Any, event: dict[str, Any]) -> None:
    if isinstance(runtime, ProductionIntegrationRuntime):
        runtime.store.append_audit(event)
    else:
        runtime.audit.append(event)


def handle_order_created(
    event: dict[str, Any],
    runtime: Any,
) -> dict[str, Any]:
    """Minimum integration path: order.created.v1 -> ERP command -> adapter.

    Validation, mapping and dispatch happen here; idempotency, retries, audit and
    dead-lettering are provided by the runtime.
    """
    errors = validate_order_created(event)
    if errors:
        raise OrderCreatedError(
            "Invalid order.created.v1 event: " + "; ".join(errors)
        )

    command = order_created_to_erp_command(event)
    delivery = runtime.dispatch(command)

    audit_event = {
        "event": AUDIT_EVENT,
        "event_id": event["event_id"],
        "entity_id": event["entity_id"],
        "tenant_id": event["tenant_id"],
        "command_id": command.command_id,
        "provider": delivery.provider,
        "success": delivery.success,
        "external_id": delivery.external_id,
        "error": delivery.error,
        "pending": delivery.pending,
    }
    _record_audit(runtime, audit_event)
    return {"command": command, "delivery": delivery, "audit": audit_event}


def load_event(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        if path.suffix == ".json":
            value = json.load(fh)
        else:
            value = yaml.safe_load(fh)
    if not isinstance(value, dict):
        raise OrderCreatedError(f"Expected a mapping in {path}")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Handle an order.created.v1 event through the integration runtime"
    )
    parser.add_argument("--event", type=Path, required=True)
    parser.add_argument("--tryton-base-url", default=os.getenv("TRYTON_BASE_URL"))
    parser.add_argument("--tryton-token", default=os.getenv("TRYTON_TOKEN"))
    parser.add_argument(
        "--store",
        type=Path,
        default=None,
        help="Optional SQLite durable store path for idempotency/audit persistence",
    )
    args = parser.parse_args()

    if not args.tryton_base_url:
        print("order-created-error: TRYTON_BASE_URL is required")
        return 2

    try:
        event = load_event(args.event)
    except OrderCreatedError as exc:
        print(f"order-created-error: {exc}")
        return 2

    if args.store:
        runtime: Any = ProductionIntegrationRuntime(
            SQLiteRuntimeStore(args.store), sleep=lambda _: None
        )
    else:
        runtime = IntegrationRuntime(sleep=lambda _: None)

    config = ProviderConfig(
        provider="tryton",
        base_url=args.tryton_base_url,
        token=args.tryton_token,
    )
    runtime.register("erp", tryton_adapter(config, tryton_sales_order_transport))

    try:
        result = handle_order_created(event, runtime)
    except OrderCreatedError as exc:
        print(f"order-created-error: {exc}")
        return 2

    delivery = result["delivery"]
    print(
        yaml.safe_dump(
            {
                "event_id": event["event_id"],
                "command_id": result["command"].command_id,
                "success": delivery.success,
                "external_id": delivery.external_id,
                "error": delivery.error,
                "pending": delivery.pending,
            },
            sort_keys=False,
        )
    )
    return 0 if delivery.success else 1


if __name__ == "__main__":
    raise SystemExit(main())
