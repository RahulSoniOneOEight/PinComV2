from __future__ import annotations

import time
from typing import Any

from tooling.integration.dead_letter import make_dead_letter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.runtime import (
    Adapter,
    DeliveryResult,
    DomainCommand,
    pending_result,
)


class ProductionIntegrationRuntime:
    def __init__(self, store: SQLiteRuntimeStore, sleep: Any | None = None):
        self.store = store
        self.adapters: dict[str, Adapter] = {}
        self.sleep = time.sleep if sleep is None else sleep

    def register(self, target: str, adapter: Adapter) -> None:
        self.adapters[target] = adapter

    def _wait(self, command: DomainCommand) -> None:
        seconds = getattr(command, "backoff_seconds", 0) or 0
        if seconds > 0:
            self.sleep(seconds)

    def dispatch(self, command: DomainCommand) -> DeliveryResult:
        claim = self.store.claim(command.idempotency_key)
        if not claim.acquired:
            if claim.state == "completed" and claim.result is not None:
                self.store.append_audit({
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
            self.store.release(command.idempotency_key)
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
                self.store.complete(command.idempotency_key, result)
                return result
            if attempt < command.max_attempts:
                self._wait(command)

        assert last is not None
        self.store.fail(command.idempotency_key, last)
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
