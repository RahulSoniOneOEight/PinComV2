from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from tooling.experience.telemetry import evaluate_ux_metrics


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError("telemetry JSONL rows must be objects")
            rows.append(value)
    return rows


def aggregate(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for row in rows:
        target = str(row["target"])
        for key, value in row.get("metrics", {}).items():
            buckets[target][key].append(float(value))
    result = []
    for target, metrics in sorted(buckets.items()):
        averaged = {k: sum(v) / len(v) for k, v in metrics.items() if v}
        result.append({"target": target, "metrics": averaged, "samples": max((len(v) for v in metrics.values()), default=0)})
    return result


def evaluate(rows: list[dict[str, Any]], thresholds: dict[str, float]) -> list[dict[str, Any]]:
    output = []
    for item in aggregate(rows):
        evidence = evaluate_ux_metrics(item["metrics"], thresholds)
        output.append({"target": item["target"], "samples": item["samples"], **evidence})
    return output
