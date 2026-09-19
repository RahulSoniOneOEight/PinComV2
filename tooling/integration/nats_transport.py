from __future__ import annotations

import json
from typing import Any, Protocol

from tooling.integration.runtime import DomainEvent


class NATSClient(Protocol):
    async def publish(self, subject: str, payload: bytes) -> Any:
        ...


def subject_for_event(event_type: str, prefix: str = "pinaka") -> str:
    return f"{prefix}.events.{event_type}"


async def publish_event(
    client: NATSClient,
    event: DomainEvent,
    prefix: str = "pinaka",
) -> str:
    subject = subject_for_event(event.event_type, prefix)
    payload = json.dumps(
        {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "occurred_at": event.occurred_at,
            "producer": event.producer,
            "aggregate": {
                "type": event.aggregate_type,
                "id": event.aggregate_id,
            },
            "payload": event.payload,
            "correlation_id": event.correlation_id,
            "causation_id": event.causation_id,
            "idempotency_key": event.idempotency_key,
            "schema_version": event.schema_version,
        },
        sort_keys=True,
    ).encode("utf-8")
    await client.publish(subject, payload)
    return subject
