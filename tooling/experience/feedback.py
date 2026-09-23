from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

ALLOWED = {"accepted", "accepted-with-changes", "rejected"}


def normalize_feedback(record: dict[str, Any]) -> dict[str, Any]:
    decision = str(record.get("decision", ""))
    if decision not in ALLOWED:
        raise ValueError(f"Unsupported feedback decision: {decision}")
    if not record.get("target"):
        raise ValueError("feedback target is required")
    if not record.get("reviewer"):
        raise ValueError("feedback reviewer is required")
    return {
        "target": str(record["target"]),
        "decision": decision,
        "reviewer": str(record["reviewer"]),
        "notes": list(record.get("notes", [])),
        "client_id": record.get("client_id"),
        "component_version": record.get("component_version"),
        "recorded_at": record.get("recorded_at") or datetime.now(timezone.utc).isoformat(),
    }
