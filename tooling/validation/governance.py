"""Governance enforcement — judgment-heavy artifacts must carry a reviewer/approver
identity, so builders cannot self-approve (AGENTS.md rule 19, ai-operating-model.md).

This is the enforcement half of the modus operandi: the deterministic tooling
generates, the reviewer/approver is named, and this check fails loudly if a
judgment artifact is missing its human/ChatGPT reviewer.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any
import yaml

ROOT = Path(__file__).resolve().parents[2]

# (relative path, tuple of acceptable reviewer/approver fields)
JUDGMENT_ARTIFACTS = [
    ("experience/references/adaptation.yaml", ("reviewed_by", "reviewer")),
    ("experience/qa/design-critic.yaml", ("reviewed_by", "reviewer")),
    ("experience/qa/journey-critic.yaml", ("reviewed_by", "reviewer")),
    ("approved/experience-approval.yaml", ("approved_by",)),
]


class GovernanceError(RuntimeError):
    pass


def _load(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    return value if isinstance(value, dict) else {}


def check_governance(client_id: str, root: Path = ROOT) -> dict[str, Any]:
    p = root / "client-projects" / client_id
    blockers: list[str] = []
    for rel, fields in JUDGMENT_ARTIFACTS:
        doc = _load(p / rel)
        if not doc:
            blockers.append(f"{rel}: missing artifact")
            continue
        if not any(doc.get(f) for f in fields):
            blockers.append(f"{rel}: missing reviewer/approver identity (judgment must be human/ChatGPT-reviewed)")
    return {
        "client_id": client_id,
        "status": "passed" if not blockers else "blocked",
        "blockers": blockers,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Enforce reviewer/approver identity on judgment artifacts")
    parser.add_argument("--client", required=True)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    result = check_governance(args.client, args.root)
    print(yaml.safe_dump(result, sort_keys=False))
    return 0 if result["status"] == "passed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
