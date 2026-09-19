from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def reconcile(
    *,
    record_id: str,
    flow: str,
    source: str,
    target: str,
    entity_type: str,
    entity_id: str,
    source_state: dict[str, Any] | None,
    target_state: dict[str, Any] | None,
    compare_fields: list[str],
) -> dict[str, Any]:
    if source_state is None:
        status = "missing-source"
        difference = {}
    elif target_state is None:
        status = "missing-target"
        difference = {}
    else:
        difference = {
            field: {
                "source": source_state.get(field),
                "target": target_state.get(field),
            }
            for field in compare_fields
            if source_state.get(field) != target_state.get(field)
        }
        status = "matched" if not difference else "mismatch"

    return {
        "record_id": record_id,
        "flow": flow,
        "source": source,
        "target": target,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "source_state": source_state or {},
        "target_state": target_state or {},
        "status": status,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "difference": difference,
    }
