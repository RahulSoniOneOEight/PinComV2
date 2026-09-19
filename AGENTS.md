# Agent Operating Contract

All AI/engineering agents must:
1. Read the active client project's `workflow/workflow-state.yaml` before acting.
2. Treat repository artifacts and contracts as authoritative; do not rely on chat memory for project state.
3. Read `.opencode/ai-routing.yaml` before selecting an AI role/provider.
4. Treat AI output as a proposal, never as project truth by itself.
5. Write AI proposals only under `client-projects/<client>/intelligence/ai/` and validate them before review.
6. Preserve separation between business capability, engineering domain, and provider.
7. Apply reuse-first resolution: existing client implementation → agency capability → approved component → approved OSS → extension → custom build.
8. Write material client feedback as a Change Contract before implementation.
9. Never self-authorize production release. Human production authorization is mandatory.
10. Do not change canonical entity ownership without updating the Data Contract and dependency map.
11. Keep integrations idempotent and auditable.
12. Add or update validation evidence for any changed contract, integration, critical journey, or AI-governance artifact.
13. Promote only the exact candidate validated in staging.

## Model-role policy

- Strategy: ChatGPT preferred; DeepSeek fallback.
- Architecture: ChatGPT preferred; DeepSeek fallback.
- Implementation: DeepSeek preferred; ChatGPT fallback.
- Reviewer: ChatGPT preferred; DeepSeek fallback.

Provider choice is operational configuration, not business logic.
