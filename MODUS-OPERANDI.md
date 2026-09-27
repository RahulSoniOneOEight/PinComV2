# MODUS OPERANDI — PinCommerce Phase 1 (design-first lifecycle)

> **Read this first in any fresh session.** The authoritative operating procedure for
> running a client through Steps 1–45 with best-in-class rigor. No step skipped; no
> light work.

## 0. Guiding principle

> **Best-in-class, not bare minimum.** If something "passes a validator" but isn't
> substantively done, it is not done. No filename-heuristic masquerading as judgment,
> no self-approval, no fabricated evidence.

## 1. The four actors (never collapse them)

| Actor | Does | Tool/Model |
|---|---|---|
| **Deterministic tooling** | engines, extractors, validators, gates | PinCommerce `tooling/` |
| **ChatGPT** | judgment: reference REUSE/ADAPT, design/journey review, critique | role `strategy/architecture/reviewer` |
| **DeepSeek** | structured YAML generation, fixtures | role `implementation` |
| **Human** | direction, approval, freeze, `promote` | `ai/proposals` review/promote |

**Core rule:** *AI output is never truth.* Flow = propose → deterministic generate →
schema validate → ChatGPT judge → **human promote**.

## 2. Phase 0 — preflight (read-only)

1. Read `AGENTS.md`, `.opencode/ai-routing.yaml`, `docs/ai-operating-model.md`, this file,
   and the client register (`changes/CHG-001-*`).
2. Confirm clean branch + `input/` intact (`client-input.yaml`, `source-register.yaml`, `documents/`).

## 3. The full flow (Steps 1–45, in order)

### Layer 1 — Client intelligence (Steps 1–8) — deterministic

| Step | Tool | Output | Quality bar |
|---|---|---|---|
| 1 | `init_client` + hand-written `client-input.yaml` | client input | facts / assumptions / open-questions separated, provenance |
| 2–3 | `onboarding.engine` | truth-register | facts ≠ assumptions ≠ unknowns |
| 4 | engine | industry-profile | archetype classified + evidence |
| 5 | `capabilities.py` | capability-discovery | real registry match, RETAIN/UPGRADE |
| 6 | `best_practice_engine` | benchmark + best-practice | **real research sources**, not empty |
| 7–8 | engine | gap + reuse | reuse-first hierarchy documented |

### Layer 2 — Solution intelligence (Steps 9–14) — deterministic

- **9** capability-map · **10** `journey_engine` (all journeys, ≥2 nodes, actor→surface correct)
- **11** entity-map + data-contract · **12** surface-map (all client surfaces) · **13** integration-map
- **14** solution-contract + ADRs
- Enrich `derived/journey-design.yaml` (18-field) → feed the executable graph.

### Layer 3 — Reference + experience (Steps 15–19) — extract deterministic + **ChatGPT decide** + human promote

1. **Acquire** real content (GitHub contents API, Figma API, Penpot MCP, docs) — *not file paths*.
2. **Extract** via `tooling/experience/source_analyzers/flutter.py` / `web.py` → components, tokens, journeys, layout.
3. **Map** component → `semantic_id` (deterministic).
4. **Decide** REUSE/ADAPT/COMBINE/MODERNIZE/REJECT/BUILD_NEW — **ChatGPT**, each with `reason` + `confidence` + `implementation_target` + `evidence_ref`.
5. **Promote** — human review (proposal under `intelligence/ai/`).
6. **17** strategy · **18** directions A/B/C (materially different).
7. **19 ★ HUMAN GATE — direction selection** (this is **M1**).

### Layer 4 — Design system + Penpot (Steps 20–28) — deterministic build + ChatGPT/human review

- **20** tokens/theme · **21** component contracts · **22** Design IR
- **23** icons (≥20) + motion (≥8) + assets resolved-or-marked-unresolved
- **24** real Penpot (MCP) — never invent project/revision IDs
- **25–26** screens/states · **27** visual QA (run, not `not-run`) · **28** interactive prototype
- **M2 = design-system selection in Penpot** (evaluate ≥3 kits, use Penpot AI Kit, human review)
- Use the **Penpot AI Kit**: `penpot-router` → one skill, `execute_code` one step at a time,
  `export_shape` + **look at the image** at every checkpoint, human OK.

### Layer 5 — Independent QA (Steps 29–32)

- Critics via `critics.py` with a **named reviewer** (not the builder).
- Visual QA **run** by a human/multimodal model.

### Layer 6 — Human review + freeze (Steps 33–45)

- **33–40** review package · **41** feedback · **42 ★ HUMAN — experience decision**
- **43** change loop · **44** re-QA · **45 ★ HUMAN — freeze**

## 4. The human checkpoints (never skip)

| Gate | Decision | Evidence |
|---|---|---|
| **M1** | direction A/B/C | A/B/C tabular comparison + 18-field journey tables + judgment |
| **M2** | design system | kit evaluation + finished Penpot DS |
| **19** | direction (Step 19) | `selected_direction` |
| **42** | experience decision | approved review round |
| **45** | freeze | immutable `experience-approval` + scope baseline |

## 5. The validators that gate "done"

```bash
python -m tooling.orchestrator.phase1_45 --client client101 --check   # substance checks
python -m tooling.validation.governance --client client101            # reviewer/approver identity
python -m tooling.orchestrator.design_gate --client client101         # hard production gate
python -m unittest discover -s tests                                  # full suite
```

## 6. Anti-patterns (halt if you catch yourself)

| Don't | Do instead |
|---|---|
| hardcode a hex / skip a token | use the governed semantic token |
| filename → ADAPT/REJECT | extract content → explicit decision + reason + target |
| generate the whole system one-shot | one `execute_code` per step + `export_shape` + look |
| builder self-approves critic | named independent reviewer |
| DeepSeek does the judgment | ChatGPT (or human) judges; DeepSeek implements |
| "file exists = done" | run the substance validator |

## 7. Authority chain

```
MODUS-OPERANDI.md (this) → AGENTS.md (rules) → ai-routing.yaml (roles)
  → ai-operating-model.md (propose/review/promote) → workflows/*.yaml (stages + gates)
    → tooling/ (engines, extractors, validators) → Penpot AI Kit (design methodology)
```
