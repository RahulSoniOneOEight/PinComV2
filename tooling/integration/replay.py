from __future__ import annotations

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
    runtime.store.append_audit({
        "event": "integration.dead_letter_replayed",
        "dead_letter_id": dead_letter["dead_letter_id"],
        "authorized_by": authorized_by,
        "success": result.success,
    })
    return result
