from __future__ import annotations

from typing import Any


DEFAULT_CHECKS = [
    "contract-validation",
    "unit-tests",
    "integration-tests",
    "e2e-critical-journeys",
    "security-secrets",
    "security-authz",
    "tenant-isolation",
    "dependency-vulnerability",
    "performance-budget",
    "accessibility",
    "migration-safety",
    "backup-recovery",
    "observability",
    "reconciliation",
    "provider-health",
]


def build_hardening_evidence(
    candidate_id: str,
    results: dict[str, tuple[str, str]],
) -> dict[str, Any]:
    checks = []
    for check_id in DEFAULT_CHECKS:
        status, evidence = results.get(check_id, ("not-run", ""))
        checks.append({
            "id": check_id,
            "status": status,
            "evidence": evidence,
            "notes": [],
        })
    blocking = [c for c in checks if c["status"] in {"fail", "not-run"}]
    return {
        "evidence_id": f"HARD-{candidate_id}",
        "candidate_id": candidate_id,
        "checks": checks,
        "status": "passed" if not blocking else "failed",
    }
