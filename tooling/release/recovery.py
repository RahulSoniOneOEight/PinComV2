from __future__ import annotations

from typing import Any


def make_recovery_record(
    *,
    recovery_id: str,
    release_id: str,
    reason: str,
    action: str,
    target_candidate_id: str | None = None,
) -> dict[str, Any]:
    if action not in {"rollback", "roll-forward", "restore", "disable-feature"}:
        raise ValueError("Unsupported recovery action")
    return {
        "recovery_id": recovery_id,
        "release_id": release_id,
        "reason": reason,
        "action": action,
        "target_candidate_id": target_candidate_id,
        "status": "planned",
        "notes": [],
    }
