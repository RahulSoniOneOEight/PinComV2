from __future__ import annotations

from typing import Any

from tooling.experience.learning_loop import build_learning_signals


def rank_candidates(
    candidates: list[dict[str, Any]],
    outcomes: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    *,
    policy: dict[str, Any] | None = None,
) -> dict[str, Any]:
    learning = build_learning_signals(outcomes, telemetry, policy=policy)
    adjustments = {x["target"]: int(x["ranking_adjustment"]) for x in learning["signals"]}
    ranked = []
    for candidate in candidates:
        target = str(candidate["id"])
        base = float(candidate.get("base_score", 0))
        adjustment = adjustments.get(target, 0)
        ranked.append({**candidate, "learning_adjustment": adjustment, "advisory_score": round(base + adjustment, 2)})
    ranked.sort(key=lambda x: (-float(x["advisory_score"]), str(x["id"])))
    return {
        "candidates": ranked,
        "learning": learning,
        "status": "advisory-only",
        "requires_human_approval": True,
    }
