from __future__ import annotations

from typing import Any


def score_candidate(candidate: dict[str, Any], weights: dict[str, float]) -> dict[str, Any]:
    dimensions = candidate.get("dimensions", {})
    missing = sorted(set(weights) - set(dimensions))
    if missing:
        raise ValueError(f"Missing tournament dimensions: {missing}")
    total = sum(float(v) for v in weights.values())
    if total <= 0:
        raise ValueError("Tournament weights must sum above zero")
    score = sum(float(dimensions[k]) * float(w) for k, w in weights.items()) / total
    return {**candidate, "score": round(score, 2)}


def select_review_winner(candidates: list[dict[str, Any]], weights: dict[str, float], minimum_score: float = 80) -> dict[str, Any]:
    scored = [score_candidate(c, weights) for c in candidates if c.get("dependency_eligibility") == "eligible"]
    review_ready = [c for c in scored if c["score"] >= minimum_score and c.get("deterministic_evidence")]
    if not review_ready:
        raise ValueError("No review-ready candidate")
    winner = sorted(review_ready, key=lambda x: (-x["score"], str(x.get("id"))))[0]
    return {
        "winner": winner,
        "candidates": scored,
        "status": "human-review-required",
        "rule": "automated tournament proposes a review winner; it does not approve or promote it",
    }
