from __future__ import annotations

from typing import Any

from tooling.integration.dead_letter import make_dead_letter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.runtime import Adapter, DeliveryResult, DomainCommand


class ProductionIntegrationRuntime:
    def __init__(self, store: SQLiteRuntimeStore):
        self.store = store
        self.adapters: dict[str, Adapter] = {}

    def register(self, target: str, adapter: Adapter) -> None:
        self.adapters[target] = adapter

    def dispatch(self, command: DomainCommand) -> DeliveryResult:
        existing = self.store.get_result(command.idempotency_key)
        if existing is not None:
            self.store.append_audit({
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
            self.store.append_audit({
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
                self.store.put_result(command.idempotency_key, result)
                return result

        assert last is not None
        dead_letter = make_dead_letter(
            dead_letter_id=f"DLQ-{command.command_id}",
            kind="command",
            payload={
                "command_id": command.command_id,
                "command_type": command.command_type,
                "target": command.target,
                "payload": command.payload,
                "idempotency_key": command.idempotency_key,
                "correlation_id": command.correlation_id,
            },
            reason=last.error or "delivery-failed",
            attempts=command.max_attempts,
        )
        self.store.put_dead_letter(dead_letter)
        return last

    def delivery_exceptions(self) -> list[dict[str, Any]]:
        return self.store.list_dead_letters()
