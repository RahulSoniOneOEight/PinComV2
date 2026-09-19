# Universal Review

The review subsystem generalizes the existing Flutter review model across surfaces.

The canonical, CI-validated review contract is the **Review Session**
(`contracts/schemas/review-session.schema.json`). `review/artifact-contract.md` describes a
legacy artifact shape and is not validated. See `docs/governance-status.md`.

A review session identifies:
- client and surface
- route/screen
- environment and build identity
- journey and direction
- viewport
- screenshot/live preview
- comments and approval state

Material feedback must be converted into a Change Contract before production implementation.
