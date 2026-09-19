from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from tooling.integration.runtime import DomainEvent


def canonicalize_webhook(
    *,
    provider: str,
    webhook_type: str,
    payload: dict[str, Any],
) -> DomainEvent:
    key = f"{provider}.{webhook_type}"
    mappings = {
        "medusa.order": ("order.confirmed", "order", "id"),
        "mercur.seller": ("seller.updated", "seller", "id"),
        "chatwoot.conversation": ("customer.support_requested", "conversation", "id"),
    }
    if key not in mappings:
        raise ValueError(f"Unsupported webhook: {key}")

    event_type, aggregate_type, id_field = mappings[key]
    aggregate_id = str(payload[id_field])
    event_id = str(payload.get("event_id") or f"{provider}-{webhook_type}-{aggregate_id}")

    return DomainEvent(
        event_id=event_id,
        event_type=event_type,
        producer=provider,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        payload=payload,
        idempotency_key=f"webhook:{key}:{event_id}",
        occurred_at=str(payload.get("occurred_at") or datetime.now(timezone.utc).isoformat()),
    )
