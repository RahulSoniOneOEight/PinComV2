from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.runtime import DomainCommand


class ReplayAuthorizationError(RuntimeError):
    pass


def replay_dead_letter(
    *,
    runtime: ProductionIntegrationRuntime,
    dead_letter: dict[str, Any],
    authorized_by: str | None,
) -> Any:
    if not authorized_by:
        raise ReplayAuthorizationError("Explicit operator authorization is required")
    if dead_letter.get("kind") != "command":
        raise ValueError("Only command dead letters are replayable by this function")

    payload = dead_letter["payload"]
    command = DomainCommand(
        command_id=f"{payload['command_id']}-replay",
        command_type=payload["command_type"],
        target=payload["target"],
        payload=payload.get("payload", {}),
        idempotency_key=payload["idempotency_key"],
        correlation_id=payload.get("correlation_id"),
    )
    result = runtime.dispatch(command)

    # Persist the replay outcome on the dead letter so its state is no longer
    # indistinguishable from an untouched record.
    updated = dict(dead_letter)
    updated["status"] = "replayed" if result.success else "open"
    updated["replay"] = {
        "authorized_by": authorized_by,
        "at": datetime.now(timezone.utc).isoformat(),
        "success": result.success,
        "command_id": command.command_id,
        "external_id": result.external_id,
        "error": result.error,
    }
    runtime.store.put_dead_letter(updated)
    runtime.store.append_audit({
        "event": "integration.dead_letter_replayed",
        "dead_letter_id": dead_letter["dead_letter_id"],
        "authorized_by": authorized_by,
        "success": result.success,
    })
    return result
