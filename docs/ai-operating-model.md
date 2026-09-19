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

OpenCode → specialist model → AI proposal artifact → schema validation → reviewer/human decision → governed project artifact.

Promotion is a human-gated step. `tooling.ai.proposals` implements `validate`, `review`, and
`promote`:

- `review` records a human decision on the proposal;
- `promote` requires an explicit human promoter **and** an approved/modified human review, then
  validates the proposal and the decision record against their schemas and writes a decision
  record to `intelligence/ai/decisions/` (audit evidence appended to `model-runs.jsonl`).

`promote` never writes to `derived/*` or `solution/*`. To influence the deterministic blueprint,
a human updates `input/client-input.yaml` and re-runs the onboarding engine (which is
drift-checked). See `docs/governance-status.md`.

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
8. A human records the decision via `tooling.ai.proposals review`; accepted proposals are promoted via `tooling.ai.proposals promote` into the decisions ledger, which informs a human edit of `input/client-input.yaml`.
9. The deterministic onboarding engine regenerates governed artifacts; CI validates final repository state.
