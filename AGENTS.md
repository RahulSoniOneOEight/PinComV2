# Agent Operating Contract

All AI/engineering agents must:
1. Read the active client project's `workflow/workflow-state.yaml` before acting.
2. Treat repository artifacts and contracts as authoritative; do not rely on chat memory for project state.
3. Preserve separation between business capability, engineering domain, and provider.
4. Apply reuse-first resolution: existing client implementation → agency capability → approved component → approved OSS → extension → custom build.
5. Write material client feedback as a Change Contract before implementation.
6. Never self-authorize production release. Human production authorization is mandatory.
7. Do not change canonical entity ownership without updating the Data Contract and dependency map.
8. Keep integrations idempotent and auditable.
9. Add or update validation evidence for any changed contract, integration, or critical journey.
10. Promote only the exact candidate validated in staging.
