from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as fh:
        value = yaml.safe_load(fh)
    return value if isinstance(value, dict) else {}


def summarize_client(project: Path) -> dict[str, Any]:
    client_id = project.name
    workflow = load_yaml(project / "workflow" / "workflow-state.yaml")
    solution = load_yaml(project / "solution" / "solution-contract.yaml")
    ops = load_yaml(project / "production" / "ops" / "exceptions.yaml")
    auth = load_yaml(project / "release" / "production-authorization.yaml")

    candidates_dir = project / "release" / "candidates"
    candidates = sorted(candidates_dir.glob("*.yaml")) if candidates_dir.exists() else []
    latest_candidate = load_yaml(candidates[-1]) if candidates else {}

    delivery_exceptions = ops.get("delivery_exceptions", [])
    reconciliation_exceptions = ops.get("reconciliation_exceptions", [])

    return {
        "client_id": client_id,
        "workflow_stage": workflow.get("current_stage", "unknown"),
        "blocked": bool(workflow.get("blocked", False)),
        "industry": solution.get("industry") or solution.get("client_profile", {}).get("industry"),
        "candidate_id": latest_candidate.get("candidate_id"),
        "candidate_status": latest_candidate.get("status"),
        "production_authorization": auth.get("decision", "not-recorded"),
        "delivery_exceptions": len(delivery_exceptions),
        "reconciliation_exceptions": len(reconciliation_exceptions),
        "operational_attention": bool(delivery_exceptions or reconciliation_exceptions),
    }


def build_index(root: Path = ROOT) -> dict[str, Any]:
    projects = root / "client-projects"
    clients = []
    if projects.exists():
        for project in sorted(projects.iterdir()):
            if project.is_dir() and (project / "workflow").exists():
                clients.append(summarize_client(project))
    return {
        "clients": clients,
        "totals": {
            "clients": len(clients),
            "blocked": sum(1 for c in clients if c["blocked"]),
            "operational_attention": sum(1 for c in clients if c["operational_attention"]),
            "authorized": sum(1 for c in clients if c["production_authorization"] == "approved"),
        },
    }


def main() -> int:
    print(json.dumps(build_index(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
