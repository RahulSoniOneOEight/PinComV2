from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol


@dataclass(frozen=True)
class DomainEvent:
    event_id: str
    event_type: str
    producer: str
    aggregate_type: str
    aggregate_id: str
    payload: dict[str, Any]
    idempotency_key: str
    correlation_id: str | None = None
    causation_id: str | None = None
    schema_version: int = 1
    occurred_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass(frozen=True)
class DomainCommand:
    command_id: str
    command_type: str
    target: str
    payload: dict[str, Any]
    idempotency_key: str
    correlation_id: str | None = None
    max_attempts: int = 3
    backoff_seconds: int = 5


@dataclass
class DeliveryResult:
    success: bool
    provider: str
    command_id: str
    attempt: int
    external_id: str | None = None
    error: str | None = None


class Adapter(Protocol):
    provider: str

    def execute(self, command: DomainCommand) -> DeliveryResult:
        ...


class IdempotencyStore:
    def __init__(self) -> None:
        self._results: dict[str, DeliveryResult] = {}

    def get(self, key: str) -> DeliveryResult | None:
        return self._results.get(key)

    def put(self, key: str, result: DeliveryResult) -> None:
        self._results[key] = result


class IntegrationRuntime:
    def __init__(self) -> None:
        self.adapters: dict[str, Adapter] = {}
        self.idempotency = IdempotencyStore()
        self.audit: list[dict[str, Any]] = []

    def register(self, target: str, adapter: Adapter) -> None:
        self.adapters[target] = adapter

    def dispatch(self, command: DomainCommand) -> DeliveryResult:
        existing = self.idempotency.get(command.idempotency_key)
        if existing is not None:
            self.audit.append({
                "event": "integration.idempotent_replay",
                "command_id": command.command_id,
                "target": command.target,
                "provider": existing.provider,
            })
            return existing

        if command.target not in self.adapters:
            raise KeyError(f"No adapter registered for target: {command.target}")

        adapter = self.adapters[command.target]
        last: DeliveryResult | None = None
        for attempt in range(1, command.max_attempts + 1):
            result = adapter.execute(command)
            result.attempt = attempt
            self.audit.append({
                "event": "integration.delivery_attempt",
                "command_id": command.command_id,
                "target": command.target,
                "provider": adapter.provider,
                "attempt": attempt,
                "success": result.success,
                "error": result.error,
            })
            last = result
            if result.success:
                self.idempotency.put(command.idempotency_key, result)
                return result

        assert last is not None
        return last


def order_confirmed_to_erp_command(event: DomainEvent) -> DomainCommand:
    if event.event_type != "order.confirmed":
        raise ValueError("Expected order.confirmed event")

    return DomainCommand(
        command_id=f"cmd-{event.event_id}-erp",
        command_type="erp.create_sales_order",
        target="erp",
        payload={
            "order_id": event.aggregate_id,
            **event.payload,
        },
        idempotency_key=f"erp-order:{event.aggregate_id}",
        correlation_id=event.correlation_id or event.event_id,
    )
