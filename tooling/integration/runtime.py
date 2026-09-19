from __future__ import annotations

import threading
import time
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
    pending: bool = False


@dataclass
class Claim:
    """Outcome of trying to acquire an idempotency key.

    ``state`` is one of ``acquired``, ``completed``, ``in_progress`` or
    ``retryable``. Only ``acquired`` grants the caller permission to execute the
    external side effect.
    """

    acquired: bool
    state: str
    result: DeliveryResult | None = None


class Adapter(Protocol):
    provider: str

    def execute(self, command: DomainCommand) -> DeliveryResult:
        ...


class IdempotencyStore:
    """In-memory idempotency store for deterministic (non-production) runtimes."""

    def __init__(self) -> None:
        self._states: dict[str, str] = {}
        self._results: dict[str, DeliveryResult] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> DeliveryResult | None:
        return self._results.get(key)

    def put(self, key: str, result: DeliveryResult) -> None:
        with self._lock:
            self._states[key] = "completed"
            self._results[key] = result

    def claim(self, key: str) -> Claim:
        with self._lock:
            state = self._states.get(key)
            if state == "completed":
                return Claim(False, "completed", self._results.get(key))
            if state == "processing":
                return Claim(False, "in_progress")
            self._states[key] = "processing"
            return Claim(True, "acquired")

    def complete(self, key: str, result: DeliveryResult) -> None:
        with self._lock:
            self._states[key] = "completed"
            self._results[key] = result

    def fail(self, key: str, result: DeliveryResult) -> None:
        with self._lock:
            self._states[key] = "failed"
            self._results[key] = result

    def release(self, key: str) -> None:
        with self._lock:
            if self._states.get(key) == "processing":
                self._states.pop(key, None)


def pending_result(command: DomainCommand, provider: str) -> DeliveryResult:
    """A non-executed result returned when another worker owns the key."""
    return DeliveryResult(
        success=False,
        provider=provider,
        command_id=command.command_id,
        attempt=0,
        error="idempotency-key-in-progress",
        pending=True,
    )


class IntegrationRuntime:
    def __init__(self, sleep: Any | None = None) -> None:
        self.adapters: dict[str, Adapter] = {}
        self.idempotency = IdempotencyStore()
        self.audit: list[dict[str, Any]] = []
        self.sleep = time.sleep if sleep is None else sleep

    def register(self, target: str, adapter: Adapter) -> None:
        self.adapters[target] = adapter

    def _wait(self, command: DomainCommand) -> None:
        seconds = getattr(command, "backoff_seconds", 0) or 0
        if seconds > 0:
            self.sleep(seconds)

    def dispatch(self, command: DomainCommand) -> DeliveryResult:
        claim = self.idempotency.claim(command.idempotency_key)
        if not claim.acquired:
            if claim.state == "completed" and claim.result is not None:
                self.audit.append({
                    "event": "integration.idempotent_replay",
                    "command_id": command.command_id,
                    "target": command.target,
                    "provider": claim.result.provider,
                })
                return claim.result
            provider = (
                self.adapters[command.target].provider
                if command.target in self.adapters
                else command.target
            )
            return pending_result(command, provider)

        if command.target not in self.adapters:
            self.idempotency.release(command.idempotency_key)
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
                self.idempotency.complete(command.idempotency_key, result)
                return result
            if attempt < command.max_attempts:
                self._wait(command)

        assert last is not None
        self.idempotency.fail(command.idempotency_key, last)
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
