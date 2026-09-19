from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from tooling.release.hardening import evaluate_hardening

# Candidate statuses that are eligible for promotion to production.
PROMOTABLE_STATUSES = {"staging-passed", "uat-passed", "authorized"}
VALID_ENVIRONMENTS = {"staging", "production"}


class GateError(RuntimeError):
    pass


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise GateError(f"Missing release evidence: {path}")
    with path.open("r", encoding="utf-8") as fh:
        value = yaml.safe_load(fh)
    if not isinstance(value, dict):
        raise GateError(f"Expected mapping in {path}")
    return value


def _require_candidate_id(document: dict[str, Any], candidate_id: str, label: str) -> None:
    if document.get("candidate_id") != candidate_id:
        raise GateError(
            f"{label} does not reference the exact candidate {candidate_id}"
        )


def verify_release_readiness(
    *,
    candidate_path: Path,
    hardening_path: Path,
    uat_path: Path,
    authorization_path: Path,
    staging_path: Path,
    observability_path: Path | None = None,
) -> dict[str, Any]:
    """Verify that the exact candidate is authorized and fully evidenced.

    A production release must not pass with missing staging evidence. All
    evidence documents must reference the exact same ``candidate_id``.
    """
    candidate = load_yaml(candidate_path)
    hardening = load_yaml(hardening_path)
    staging = load_yaml(staging_path)
    uat = load_yaml(uat_path)
    auth = load_yaml(authorization_path)

    candidate_id = candidate.get("candidate_id")
    if not candidate_id:
        raise GateError("Release candidate is missing candidate_id")

    # Candidate integrity and promotion eligibility.
    if candidate.get("immutable") is not True:
        raise GateError("Release candidate is not immutable")
    digest = candidate.get("artifact_digest")
    if not isinstance(digest, str) or not digest.strip():
        raise GateError("Release candidate artifact_digest is empty")
    if candidate.get("environment") not in VALID_ENVIRONMENTS:
        raise GateError(
            f"Release candidate environment is not promotable: {candidate.get('environment')!r}"
        )
    if candidate.get("status") not in PROMOTABLE_STATUSES:
        raise GateError(
            f"Release candidate status is not promotable: {candidate.get('status')!r}"
        )

    # All evidence must reference the exact candidate.
    _require_candidate_id(hardening, candidate_id, "Hardening evidence")
    _require_candidate_id(staging, candidate_id, "Staging validation")
    _require_candidate_id(uat, candidate_id, "UAT record")
    _require_candidate_id(auth, candidate_id, "Production authorization")

    # Hardening must pass under the strict blocking policy.
    evaluation = evaluate_hardening(hardening)
    if evaluation["status"] != "passed" or hardening.get("status") != "passed":
        raise GateError(
            "Hardening evidence has not passed: "
            f"blocking checks {evaluation['blocking']}"
        )

    # Staging validation is mandatory.
    if staging.get("status") != "passed":
        raise GateError("Staging validation has not passed")

    # Observability evidence is part of the reference release contract.
    if observability_path is not None:
        observability = load_yaml(observability_path)
        _require_candidate_id(observability, candidate_id, "Observability evidence")
        if observability.get("status") != "passed":
            raise GateError("Observability evidence has not passed")

    if uat.get("status") != "passed":
        raise GateError("UAT has not passed")
    if not uat.get("approved_by"):
        raise GateError("UAT has no human approver")

    if auth.get("decision") != "approved":
        raise GateError("Production authorization is not approved")
    if not auth.get("authorized_by"):
        raise GateError("Production authorization has no human authorizer")

    return {
        "candidate_id": candidate_id,
        "ready": True,
        "artifact_digest": digest,
        "authorized_by": auth["authorized_by"],
        "staging_validation_id": staging.get("validation_id"),
    }
