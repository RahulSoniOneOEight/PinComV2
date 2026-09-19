# OpenCode AI Operating Model

OpenCode is the day-to-day orchestration surface.

## Responsibility split

| Layer | Responsibility |
|---|---|
| OpenCode | orchestration, agent routing, repository actions |
| ChatGPT | strategy, architecture, interpretation, complex impact reasoning, final review |
| DeepSeek | implementation, structured generation, fixtures, repetitive coding |
| Deterministic tooling | onboarding, workflow state, contracts, validation, composition |
| GitHub | durable source of truth, PRs, CI, release evidence |
| Human | material business decisions, UAT, production authorization |

## Core rule

AI output is never project truth by itself.

AI output follows:

OpenCode → specialist model → AI proposal artifact → schema validation → reviewer/human decision → deterministic promotion → governed project artifact.

## Proposal location

`client-projects/<client>/intelligence/ai/`

Recommended files:
- interpretation.yaml
- recommendations.yaml
- architecture-review.yaml
- model-runs.jsonl
- decisions/

## Model routing

See `.opencode/ai-routing.yaml`.

The provider is selected by role, not hard-coded into business logic. This keeps model replacement possible.

## Typical onboarding path

1. OpenCode reads client input and workflow state.
2. Strategy Agent uses ChatGPT to interpret ambiguous business language.
3. AI interpretation is saved as a proposal.
4. Deterministic onboarding engine generates the baseline blueprint.
5. Strategy/Architecture agents compare AI proposals with registry-derived outputs.
6. DeepSeek may generate structured expansions or tests.
7. Reviewer Agent checks conflicts and risk.
8. Accepted proposals are promoted through deterministic tooling.
9. CI validates final repository state.
