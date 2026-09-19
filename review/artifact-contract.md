# Review Artifact Contract (Legacy)

> **Legacy / superseded.** The canonical review model is the **Review Session**
> (`contracts/schemas/review-session.schema.json`), which is what CI validates. This document
> and `contracts/schemas/review-artifact.schema.json` are retained for history and are not
> validated. See `docs/governance-status.md`.

Every reviewable surface should carry:
- client ID
- surface
- route/screen
- environment
- build identity
- direction
- journey
- viewport
- live preview and/or screenshot reference
- comments/annotations
- approval state

The same contract is used for Flutter, web, admin, ERP-facing extensions and Ops surfaces.

Review feedback that changes scope, business rules, integrations, data ownership or security becomes a Change Contract. Pure visual adjustments may remain in the experience feedback loop.
