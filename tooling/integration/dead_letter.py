from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def make_dead_letter(
    *,
    dead_letter_id: str,
    kind: str,
    payload: dict[str, Any],
    reason: str,
    attempts: int,
) -> dict[str, Any]:
    return {
        "dead_letter_id": dead_letter_id,
        "kind": kind,
        "payload": payload,
        "reason": reason,
        "attempts": attempts,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "open",
    }
