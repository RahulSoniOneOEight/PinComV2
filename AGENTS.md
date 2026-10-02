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
14. References inform; client objectives and governed truth decide. Every declared reference must end in REUSE, ADAPT, COMBINE, MODERNIZE, REJECT, or BUILD_NEW; silent non-use is forbidden.
15. A screen, YAML file, successful build, or agent assertion is not evidence of a completed journey. Completion requires the stage validator and required evidence.
16. Never change an approved upstream contract merely to make a downstream validator pass; invalidate and regenerate affected downstream artifacts instead.
17. Before designing or building, discover existing PinCommerce capabilities and classify them RETAIN, REUSE, ADAPT, UPGRADE, REPLACE, or BUILD.
18. OpenPencil/design components must be implementation-aware: semantic ID, tokens, states, responsive rules, Flutter/Web mapping, accessibility intent, and QA evidence are required before approval.
19. Builders do not approve their own work. Use independent design, journey, and runtime acceptance where the stage requires it.
20. Session/chat history is not project memory. Update workflow state, active decisions, CURRENT summary, checkpoint/handoff, and validation evidence at governed boundaries.
21. Client-facing UI code must resolve semantic components through the governed UI Implementation Registry; ad-hoc library selection is forbidden.
22. OpenPencil defines design intent; Design IR and semantic component contracts mediate implementation. Direct OpenPencil-to-production-code export is forbidden.
23. Icons resolve through the governed icon registry (Phosphor primary, Iconoir secondary, Hugeicons fallback unless an approved client registry overrides it); motion/layout/table/chart/carousel choices resolve through the UI registry.
24. Production UI generation requires the hard design gate and post-build design-build QA; drift from the approved OpenPencil/design revision is blocking.

## OpenPencil page targeting (v0.15.1)

- MCP `find_nodes` is recursive and searches one page: the actual current page when `page_id` is omitted, or the explicitly targeted page when both `document_id` and `page_id` are supplied. Always pass both IDs for page-scoped MCP work; do not rely on `switch_page`, whose reported switch does not persist to the next MCP call in v0.15.1.
- Reproduction on `apnakart-design.fig`: an untargeted MCP frame search returned 779; `switch_page` followed by the same search still returned 779 on every page; explicit MCP `page_id` searches returned 198 / 1432 / 0 / 73 after reorganisation (975 / 779 / 0 / 0 before it).
- CLI file mode is authoritative for a saved revision: `openpencil find <file> --type FRAME --limit 10000 --json` searches all pages, while `--page "<page name>"` scopes it. Connected CLI `--page-id` is defective in v0.15.1 and returned the whole document for every page ID.
- `export_image` still requires the node to be on the desktop app's actual active page; its `page_id` does not bypass the single-page raster check. Activate that page in the UI before raster verification. See `tooling/experience/openpencil-page-scoping.md` for evidence and safe workflow.

## Model-role policy

- Strategy: ChatGPT preferred; DeepSeek fallback.
- Architecture: ChatGPT preferred; DeepSeek fallback.
- Implementation: DeepSeek preferred; ChatGPT fallback.
- Reviewer: ChatGPT preferred; DeepSeek fallback.

Provider choice is operational configuration, not business logic.
