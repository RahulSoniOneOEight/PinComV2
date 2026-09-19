from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


class GateError(RuntimeError):
    pass


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        value = yaml.safe_load(fh)
    if not isinstance(value, dict):
        raise GateError(f"Expected mapping in {path}")
    return value


def verify_release_readiness(
    *,
    candidate_path: Path,
    hardening_path: Path,
    uat_path: Path,
    authorization_path: Path,
) -> dict[str, Any]:
    candidate = load_yaml(candidate_path)
    hardening = load_yaml(hardening_path)
    uat = load_yaml(uat_path)
    auth = load_yaml(authorization_path)

    candidate_id = candidate["candidate_id"]
    linked = {
        hardening.get("candidate_id"),
        uat.get("candidate_id"),
        auth.get("candidate_id"),
    }
    if linked != {candidate_id}:
        raise GateError("All release evidence must reference the exact candidate")

    if hardening.get("status") != "passed":
        raise GateError("Hardening evidence has not passed")
    if uat.get("status") != "passed":
        raise GateError("UAT has not passed")
    if auth.get("decision") != "approved":
        raise GateError("Production authorization is not approved")

    return {
        "candidate_id": candidate_id,
        "ready": True,
        "authorized_by": auth["authorized_by"],
    }
