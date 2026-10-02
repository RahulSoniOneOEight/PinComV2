"""Evaluate a client project against the platform design-element taxonomy.

Every client project must evaluate the same design element families
(``design-contract/design-element-inventory.yaml``) before its design can be
reviewed or approved. This module scores a client's instantiation and reports
what is still required.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]

TAXONOMY_REF = Path("design-contract") / "design-element-inventory.yaml"
CLIENT_REF = Path("experience") / "design" / "design-element-inventory.yaml"

STATUSES = ("done", "partial", "missing", "not-applicable")


class DesignInventoryError(RuntimeError):
    pass


def _load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise DesignInventoryError(f"Missing design-element inventory input: {path}")
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise DesignInventoryError(f"Expected mapping: {path}")
    return value


def evaluate_documents(taxonomy: dict[str, Any], client: dict[str, Any]) -> dict[str, Any]:
    """Compare a client inventory against the platform taxonomy."""
    elements = taxonomy.get("elements") or []
    if not elements:
        raise DesignInventoryError("Taxonomy declares no elements")
    known = {e["id"]: e for e in elements}

    reported = {}
    for item in client.get("elements") or []:
        eid = item.get("id")
        if eid in reported:
            raise DesignInventoryError(f"Duplicate element id in client inventory: {eid}")
        reported[eid] = item

    unknown = sorted(set(reported) - set(known))
    missing = sorted(set(known) - set(reported))

    blockers: list[str] = []
    warnings: list[str] = []
    by_level: dict[str, dict[str, int]] = {}

    for eid, spec in known.items():
        level = str(spec.get("level") or "?")
        bucket = by_level.setdefault(level, {"total": 0, "done": 0, "partial": 0, "missing": 0, "not-applicable": 0})
        bucket["total"] += 1

        item = reported.get(eid)
        status = str(item.get("status")) if item else "missing"
        if status not in STATUSES:
            raise DesignInventoryError(f"{eid}: invalid status {status!r}")
        bucket[status] += 1

        if status == "missing":
            if spec.get("evaluation") == "required":
                blockers.append(f"{eid} {spec.get('name')}: required but missing")
            elif spec.get("evaluation") == "conditional":
                warnings.append(f"{eid} {spec.get('name')}: conditional and unassessed (needs not-applicable + reason)")
        elif status == "not-applicable":
            if not str((item or {}).get("reason") or "").strip():
                warnings.append(f"{eid}: marked not-applicable without a reason")
        elif status == "partial" and spec.get("evaluation") == "required":
            warnings.append(f"{eid} {spec.get('name')}: required and only partial")

    for eid in unknown:
        warnings.append(f"{eid}: in client inventory but not in the taxonomy")
    for eid in missing:
        spec = known[eid]
        if spec.get("evaluation") == "required":
            blockers.append(f"{eid} {spec.get('name')}: not evaluated (required)")

    totals = {"total": len(known), "done": 0, "partial": 0, "missing": 0, "not-applicable": 0}
    for bucket in by_level.values():
        for key in totals:
            if key != "total":
                totals[key] += bucket[key]

    return {
        "client_id": client.get("client_id"),
        "project": client.get("project"),
        "totals": totals,
        "coverage_percent": round(100 * totals["done"] / totals["total"], 1) if totals["total"] else 0.0,
        "by_level": by_level,
        "blockers": blockers,
        "warnings": warnings,
        "gate_ready": not blockers,
        "status": "ready" if not blockers else "blocked",
    }


def evaluate(client_id: str, root: Path = ROOT, *, taxonomy_ref: Path | None = None) -> dict[str, Any]:
    taxonomy = _load(root / (taxonomy_ref or TAXONOMY_REF))
    client = _load(root / "client-projects" / client_id / CLIENT_REF)
    return evaluate_documents(taxonomy, client)


def main() -> int:
    ap = argparse.ArgumentParser(description="Evaluate a client project against the design-element taxonomy")
    ap.add_argument("--client", required=True)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--check", action="store_true", help="exit non-zero when required elements are not done")
    a = ap.parse_args()
    try:
        result = evaluate(a.client, a.root)
    except DesignInventoryError as exc:
        print(f"design-inventory-error: {exc}")
        return 2
    print(yaml.safe_dump(result, sort_keys=False))
    if a.check and not result["gate_ready"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
