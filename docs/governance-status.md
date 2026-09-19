# Contract & Governance Status

This document is the single source of truth for **which governance artifacts are enforced
today** and which are roadmap. If another document implies enforcement that is not listed
here as "Enforced now", this document wins.

Legend:
- **Enforced now** — schema/instance validated by `python tooling/validation/validate_all.py` in CI.
- **Partial** — presence is checked and/or a schema exists, but instances are not fully validated.
- **Roadmap** — documented intent only; no enforcement yet.
- **Legacy** — superseded; retained for history, not validated.

## Production contracts

| Contract | Location | Status | Enforcement |
|---|---|---|---|
| Solution Contract | `contracts/schemas/solution-contract.schema.json`, `client-projects/*/solution/` | Enforced now | JSON Schema validation of the reference instance; generated deterministically by `tooling.onboarding.engine` (drift-checked) |
| Design Contract | `design-contract/` | Partial | Required files present; no token/component JSON Schema yet |
| Integration Contract | `platform/integration/*.yaml`, `contracts/schemas/provider-adapter.schema.json` | Partial | Catalogs present; provider adapters schema-validated; unified integration schema pending |
| Data Contract | — | Roadmap | Canonical entity ownership is described in `docs/domain-platform.md` but has no schema/instance yet |
| Business Contract | — | Roadmap | Not yet defined |
| Change Contract | `contracts/schemas/change-contract.schema.json`, `templates/change-contract.yaml` | Roadmap | Schema + template exist; no instance and no CI validation yet |

## Review contracts

| Contract | Location | Status | Enforcement |
|---|---|---|---|
| Review Session | `contracts/schemas/review-session.schema.json`, `client-projects/*/feedback/` | Enforced now | Reference instance schema-validated in CI |
| Review Artifact | `contracts/schemas/review-artifact.schema.json`, `review/artifact-contract.md` | Legacy | Superseded by Review Session; no instance, not validated |
| Visual QA | `contracts/schemas/visual-qa.schema.json`, `templates/visual-qa.yaml` | Roadmap | No instance yet |

The canonical review model is **Review Session**. The review pipeline in
`docs/review-visual-validation.md` (Build Identity → Capture Manifest → Review Session →
BugDrop → Change Contract when material) is authoritative.

## Release evidence

| Artifact | Location | Status | Enforcement |
|---|---|---|---|
| Release Candidate | `contracts/schemas/release-candidate.schema.json`, `client-projects/*/release/candidates/` | Enforced now | Schema-validated; exact-candidate gate |
| Hardening Evidence | `contracts/schemas/hardening-evidence.schema.json` | Enforced now | Schema-validated; strict blocking policy in `tooling.release.hardening` |
| Staging Validation | `contracts/schemas/staging-validation.schema.json` | Enforced now | Schema-validated; required by the release gate |
| Observability Evidence | `contracts/schemas/observability-evidence.schema.json` | Enforced now | Schema-validated; required by the release gate |
| UAT Record | `contracts/schemas/uat-record.schema.json` | Enforced now | Schema-validated; human approver required |
| Production Authorization | `contracts/schemas/production-authorization.schema.json` | Enforced now | Schema-validated; human authorizer required |
| Release Record / Recovery Record | `contracts/schemas/release-record.schema.json`, `recovery-record.schema.json` | Enforced now | Schema-validated |

The release gate (`tooling.release.gates.verify_release_readiness`) requires the exact same
`candidate_id` across candidate, hardening, staging, observability, UAT and authorization, and
rejects a missing or failing staging validation.

## AI proposals

| Artifact | Location | Status | Enforcement |
|---|---|---|---|
| AI Proposal | `contracts/schemas/ai-proposal.schema.json`, `client-projects/*/intelligence/ai/` | Partial | Reference instance schema-validated; human review recorded |
| AI promotion | — | Roadmap | No automatic promotion exists; see `docs/ai-operating-model.md` |

AI output is advisory. It is never written into governed truth (`derived/*`, `solution/*`)
without a human/deterministic step. There is no automatic promotion path today.
