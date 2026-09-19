from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]

MATERIAL_CATEGORIES = {"business-rule", "integration", "data", "security", "performance", "accessibility"}


class BugDropError(RuntimeError):
    pass


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise BugDropError(f"Missing BugDrop: {path}")
    with path.open("r", encoding="utf-8") as fh:
        value = yaml.safe_load(fh)
    if not isinstance(value, dict):
        raise BugDropError(f"Expected mapping in {path}")
    return value


def save_yaml(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(value, fh, sort_keys=False)


def triage(bugdrop: dict[str, Any]) -> dict[str, Any]:
    category = bugdrop["category"]
    severity = bugdrop["severity"]
    requires_change_contract = category in MATERIAL_CATEGORIES or severity in {"high", "critical"}
    return {
        **bugdrop,
        "triage": {
            "requires_change_contract": requires_change_contract,
            "route": "change-contract" if requires_change_contract else "experience-feedback",
        },
        "status": "triaged",
    }


def to_change_contract(bugdrop: dict[str, Any], change_id: str) -> dict[str, Any]:
    triaged = triage(bugdrop)
    if not triaged["triage"]["requires_change_contract"]:
        raise BugDropError("BugDrop is visual/UX feedback and does not require a Change Contract")
    category = bugdrop["category"]
    change_type = category if category in {
        "business-rule", "integration", "data", "security"
    } else "ux"
    return {
        "change_id": change_id,
        "request": bugdrop["summary"],
        "type": change_type,
        "affected_capabilities": bugdrop.get("affected_capabilities", []),
        "affected_domains": bugdrop.get("affected_domains", []),
        "affected_surfaces": bugdrop.get("affected_surfaces", []),
        "affected_entities": [],
        "affected_events": [],
        "required_tests": ["visual"] + (
            ["integration"] if category in {"integration", "business-rule"} else []
        ),
        "approval_required": bugdrop["severity"] in {"high", "critical"} or category != "visual",
        "status": "proposed",
        "source_bugdrop": bugdrop["bugdrop_id"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Triage a BugDrop")
    parser.add_argument("path", type=Path)
    parser.add_argument("--change-id")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    try:
        bugdrop = load_yaml(args.path)
        result = triage(bugdrop)
        if args.change_id:
            result = to_change_contract(bugdrop, args.change_id)
        if args.output:
            save_yaml(args.output, result)
        else:
            print(yaml.safe_dump(result, sort_keys=False))
        return 0
    except BugDropError as exc:
        print(f"bugdrop-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
