# Updates & Remediation Register — client101 (BuildKart)

> Durable log of governance/remediation notes. Each item = one correction to how a PinCommerce step was executed.
> Authority: repository contracts + `AGENTS.md` + `docs/ai-operating-model.md` are the source of truth.

---

## Guiding Principle

**Best-in-class work, not bare minimum.** Every step must clear a *substantive* bar, not merely pass a validator's file-existence check. This principle governs all Items below.

1. **Substance over existence** — validators gate on content quality (real journeys, real icons, run QA), not file presence.
2. **Real evidence, never fabricated** — no filename heuristics or "not-run" masquerading as done.
3. **Independent review** — builders don't approve their own work (`AGENTS.md` rule 19).
4. **Human-gated checkpoints** — never one-shot; stop and get approval at each stage.
5. **Evidence-backed decisions** — every REUSE/ADAPT/review carries `reason` + `confidence` + `evidence_ref`.
6. **Role-correct** — judgment by ChatGPT/Reviewer, implementation by DeepSeek, approval by human (`ai-routing.yaml`).
7. **Best-in-class tooling** — use the full stack (Penpot AI Kit, axe-core, Lighthouse, `visual_tournament`), not bare-minimum generators.

*If something is "good enough to pass" but not "best-in-class", it is not done.*

---

## Item 1 — Correct the Reference Intelligence (Steps 15–16)

**Date:** 2026-09-27
**Status:** open (awaiting remediation)
**Owner:** RS (Project Lead) + implementation agent

### 1. What reference intelligence is supposed to be (PinCommerce)

Reference intelligence is a **proposal flow**, not a "generate and done" flow. Per
`AGENTS.md` rule 14 and `docs/ai-operating-model.md`:

1. Every declared source is **provenance-bound** (source ID/type, capture timestamp, SHA-256 content hash, provider ref).
2. Real **patterns/components/tokens/journeys** are extracted from the source *content*.
3. Every extracted pattern gets an **explicit** `REUSE | ADAPT | COMBINE | MODERNIZE | REJECT | BUILD_NEW` decision with a **reason** — `reference_patterns.decide_patterns` / `reference_engine.apply_decisions` **raise/block** on any missing decision (no silent non-use).
4. The decision is an **AI proposal** written under `intelligence/ai/`, then **human `review` → `promote`**.
5. **Judgment role = ChatGPT** (Architecture/Reviewer); **Implementation = DeepSeek** (`ai-routing.yaml`).
6. Dependency eligibility (license/security/compatibility) is run.

### 2. What actually happened (the defect)

| Step | Required | Actual |
|---|---|---|
| Provenance | content hash of *content* | ✅ real, but hash of *file listing* for git refs |
| Extraction | real components/tokens/journeys | ❌ git connector listed **file paths only** (never read code) |
| Decision | explicit per-pattern REUSE/ADAPT + reason | ❌ **filename heuristic** (`.dart`→ADAPT, icons→REJECT) |
| Dependency eligibility | license/security scan | ❌ never run |
| Human promote | `review` → `promote` | ❌ wrote decisions straight to `adaptation.yaml` |
| Model role | ChatGPT judges | ❌ DeepSeek did the judgment |

Consequence: SRC-003/004/005 are **provenance-valid but substantively hollow** — the
"ADAPT" counts (22 / 200 / 752) are filename labels, not learned patterns. Nothing was
actually learned or used from them.

### 3. The correct engine (to build)

```
source → ACQUIRE (deterministic: git contents/clone, Figma API, Penpot MCP, web, docs)
       → EXTRACT  (deterministic parsers: tokens, components+layout, journeys)
       → NORMALIZE (unified design-evidence + content-hash provenance)
       → MAP      (deterministic matcher + ChatGPT judgment: component→semantic_id, token→role)
       → DECIDE   (ChatGPT drafts REUSE/ADAPT/… + reason + confidence)
       → PROMOTE  (human review/approve)
       → EMIT     (adaptation.yaml, deep-analysis.yaml — schema-validated)
       → FEED NEXT (component contracts · design tokens · journey graph · Penpot)
```

**Deterministic vs AI vs human split:**

| Layer | Tool |
|---|---|
| Acquire / Extract / Normalize | deterministic parsers (no model) |
| Map (component/token → semantic) | deterministic matcher + synonym table |
| **Decide (REUSE/ADAPT + reason + confidence)** | **ChatGPT** (Reviewer/Architecture) |
| Structured YAML proposal | DeepSeek (Implementation) |
| **Approve / promote** | **human** |

### 4. Quality bar (acceptance criteria for "correct")

Every concluded pattern must carry: `extracted_evidence`, `mapped_to`, `decision`, `reason`,
`confidence`, `alternatives`, `journeys`, `surfaces`, `implementation_target`, `evidence_ref`
(traceable to the exact source file). No fabrication; nothing silently dropped; human-promoted.

### 5. Remediation plan

- **P1** `design-evidence` schema + provenance normalizer.
- **P2** Flutter extractor (tokens + components + journeys + nested layout).
- **P3** Web extractor (React/TSX + Tailwind/CSS).
- **P4** Figma flows + Penpot MCP extractor.
- **P5** Mapper (component/token → semantic model).
- **P6** Decision layer — ChatGPT-drafted proposals + `decide_patterns` enforcement + human promote.
- **P7** Re-run on SRC-002/003/004/005 and feed next steps.

### 6. Immediate re-do scope (once the engine exists)

| Reference | Current verdict | Correct action |
|---|---|---|
| SRC-001 (feature note) | substantive (real content read) | keep; add dependency check + human promote |
| SRC-002 (client package) | partial (briefs read, code not) | extract real TSX components/journeys |
| SRC-003 (flipkart) | hollow | extract Flutter widgets/journeys/tokens |
| SRC-004 (Bagisto) | hollow | extract Flutter widgets/journeys/tokens |
| SRC-005 (Medusa UI) | hollow | extract React components/tokens |

### 7. Related defects logged in this session (for later items)

- Step 6 benchmark not evidence-backed (no research sources).
- Step 10 journey graph: 6/13 journeys are single-node stubs; all mapped to `customer-app`.
- Step 23 icons/imagery/motion under-specified (3 icons, 3 motions, no assets resolved).
- Steps 27/29/32 visual QA `not-run` (no visual review).
- Steps 30/31 critics self-generated (builders approved their own work — rule 19).
- Model-role violations (DeepSeek did Strategy/Architecture/Reviewer work).

---

## Item 2 — Milestone 1: Review the Penpot prototype (journey + design-system + flow)

**Date:** 2026-09-27
**Status:** open (next milestone)
**Owner:** RS (Project Lead) + implementation agent

### Scope

Review the Penpot prototype at a professional journey-design level, grounded in:
1. **Text inputs + references + consultant/consult-user analysis/flow** as specified by PinCommerce (client-input, source register, journey-graph).
2. **Design system in Penpot** (tokens, components, boards).
3. **Journeys with full detail** — every journey reviewed against this table:

| Layer | Journey-design question | Example |
|---|---|---|
| Persona | Who is doing this? | B2C buyer / B2B retailer / seller |
| Goal | What are they trying to accomplish? | Buy 6 items for household use |
| Trigger | Why does journey start? | Search, ad, reorder reminder |
| Context | Device/channel/location/constraints? | Mobile, low bandwidth, Hindi/English |
| Phase | What broad stage are they in? | Discover → evaluate → buy → receive → support |
| User action | What does customer actually do? | Search product |
| Intent/thought | What question are they answering? | "Is this the right size/value?" |
| Touchpoint | Where interaction happens | Search page / PDP / WhatsApp / delivery |
| Information needed | What must UI expose? | price, pack size, delivery date |
| Decision | What choice is made? | Select SKU / seller / quantity |
| System response | What should system do? | recalculate price and availability |
| Business rule | What constraint applies? | MOQ = 6 |
| Success state | What indicates progress? | Item added to cart |
| Failure state | What can go wrong? | Stock unavailable |
| Recovery | How can user recover? | alternate pack/seller |
| Emotion/friction | Where is uncertainty/frustration? | unsure about delivery |
| Metric | How is success measured? | conversion, task time, abandonment |
| Resulting UI | What screen/component is required? | `ProductCard`, PDP, quantity selector |

4. **Penpot file for app flow + web UX** — the actual screens/flows for consumer app (mobile) and web storefront.

### Deliverable

A `Penpot Prototype Review` that covers:
- **Journey review** — 18-field table per journey (B2C: browse→buy, search→buy, checkout, payment-failure, tracking, return/refund; B2B: RFQ/quote, credit, approval, reorder; Seller/ops where present).
- **Design-system review** — tokens/typography/spacing/components as represented in Penpot, vs the governed registry.
- **App flow + web UX** — coverage of customer-app (mobile) and web-store surfaces.
- **Gap list** — missing screens, states, icons, journey branches (with severity).

### Precondition

The Penpot MCP must be connected to the **`piv2`** file (rev 49). As of 2026-09-27 the MCP is connected to `New File 2` (empty, rev 0) — open `piv2` in the Penpot UI before this milestone runs.

---

## Item 3 — Corrected human-gated flow (2 intermediate milestones → final prototype)

**Date:** 2026-09-27
**Status:** plan (supersedes Item 2's single-shot framing)
**Owner:** RS (Project Lead) — human reviewer at each gate

### Principle

No one-shot. Each stage ends at a **human checkpoint** (Penpot AI Kit "One Rule" + PinCommerce human gates).

### M1 — Human interaction 1: Direction review (A / B / C) — maps to Step 19

- One file, **tabular comparison of A / B / C**.
- For **each direction**, a **journey table** using the 18-field design (Persona → … → Resulting UI) for every journey.
- Ends with a **conclusive judgment** on which direction to pick (human decides).

### M2 — Human interaction 2: Design-system selection in Penpot — maps to Steps 20–23

- Build a **design-system file in Penpot** to select/decide the design system to use.
- **Must use:** Penpot AI Kit + reference libraries + PinCommerce repo's industry-wise theme/color-palette resources.
- OpenCode must evaluate **min 3** of the available Penpot kits:

| Kit / library | Best for | View for this app |
|---|---|---|
| Material Design 3 | full mobile/app DS | good if Flutter/mobile is primary |
| UI Design System (shadcn-style) | Radix + Tailwind + shadcn components | ⭐ best for React/Next web |
| Essential UI Kit | generic reusable components | fast start |
| Dashboard UI Kit / SnowUI | admin/seller/ops dashboards | strong for B2B/admin |
| Dashboard UI Starter Kit | fast dashboard scaffolding | seller/admin apps |
| Tailwind Kit | Tailwind visual primitives | web consistency |
| Ant Design (System / Lite) | enterprise/admin-heavy | operations-heavy |
| Atomic Design | component hierarchy methodology | structure/template |
| Penpot Design System (Pencil) | real DS structure reference | excellent reference |
| Nextcloud Design System | real open-source DS | reference |
| StyleUI | cross web+mobile UI | broad starter |
| Basic Layouts Template | grid/flex patterns | supporting |
| Minimalistic Wireframing Kit | early UX/layout | before detailed visual work |
| Ecommerce UI Kit | commerce screens/components | review for PinCommerce |
| Bootstrap 5 Starter UI Kit | Bootstrap web layouts | if Bootstrap |
| UI Kit for AWS Amplify | app patterns | stack-specific |

- **Output:** a **finished design system in Penpot**, which the human reviews.

### Final outcome (after M1 + M2 feedback)

The **final Penpot prototype** (app flow + web UX) built from the chosen direction (M1) + chosen design system (M2), incorporating review feedback.

---

## Item 4 — Platform Robustness Update Plan

**Date:** 2026-09-27
**Status:** plan (fix the platform, not just the client)

### Repo finding

The modus operandi is **already codified** but **not enforced**, and validators are shallow:

| Exists in repo | Purpose | Was used? |
|---|---|---|
| `tooling/ai/proposals.py` (`validate`→`review`→`promote`) | human-gated promotion; never writes `derived/solution` | ❌ |
| `tooling/ai/router.py` | role → provider (ChatGPT judge, DeepSeek impl) | ❌ |
| `tooling/workflow/runtime.py` (`advance` + `human_gate`) | blocks human-gate stages | ❌ |
| `tooling/validation/lifecycle.py` | lifecycle output validation | ❌ |

### 7 robustness gaps → fixes

| # | Gap | Fix |
|---|---|---|
| 1 | validators = existence-checks (`ex(path)`) | **A** — substance checks in `phase1_45.py` |
| 2 | connectors shallow (git = file paths) | **B** — deep source extractors (Flutter/Web/Figma/Penpot) |
| 3 | engines minimal (6/13 journey stubs, generic components) | **C** — enrich journey/component engines |
| 4 | critics self-generated (rule 19) | **D** — independent critics with `reviewed_by` |
| 5 | proposal/promote not enforced | **E** — CI gate: AI writes need proposal+promote |
| 6 | model-role not enforced | **E** — judgment files carry `reviewed_by` (ChatGPT/human) |
| 7 | human gates not checked (only file existence) | **A** — real human-decision records required |

### Prioritization

1. **A** (validator depth) — makes hollow steps fail.
2. **B** (extractors) — makes reference intelligence real.
3. **E** (enforcement) — locks in proposal→promote + role routing.
4. **C, D** — richer journeys + independent critics.

---

## Item 5 — Penpot AI Kit: use cases in the PinCommerce flow

**Date:** 2026-09-27
**Status:** integration plan

### Kit review (github.com/penpot/penpot-ai-kit, content-only, CC-BY-4.0)

- **13 skills**: foundations (tokens/themes), component-factory (variants), build-screen, build-from-code, build-deck, document-handoff, audit-accessibility, audit-tokens, design-to-code-review, design-md, migrate (Figma→Penpot), rename-layers, router.
- **7 workflows**: brief-to-screen, brief-to-deck, design-system-bootstrap, code-to-penpot-sync, figma-migration, accessibility-gate, routing.
- **Policies**: modes (suggest / review / autofix) + safe set + approval checkpoints.
- **Core behaviors**: works on real file, asks before changes, prefers existing tokens/components, **self-grades on 7 axes** (hierarchy/composition/type/color/spacing/content/distinctiveness), **checkpoint previews + human OK**.

### Use-case mapping to PinCommerce steps

| PinCommerce step | Penpot AI Kit skill/workflow |
|---|---|
| 15–16 reference learning | `penpot-design-md` (extract DESIGN.md from ref files) + `penpot-router` |
| 20 design tokens | `penpot-foundations` (color/spacing/type, light/dark) |
| 21 components | `penpot-component-factory` (full variant matrix) |
| 22 screens / Design IR | `penpot-build-screen` / `penpot-build-from-code` |
| 23 icons/imagery/motion | `penpot-foundations` + `component-factory` |
| 24 Penpot design | `penpot-build-screen` + `document-handoff` |
| 25–28 visual QA + prototype | kit self-review loop + 7-axis quality score |
| 30 independent critics | `penpot-audit-accessibility` + `penpot-audit-tokens` |
| 32 visual QA | `accessibility-gate` workflow |
| M2 design-system selection | `design-system-bootstrap` workflow |
| M1 + final prototype | `brief-to-screen` workflow (build→score→fix→pass) |
| handoff | `penpot-document-handoff` |

### Key integration points (what PinCommerce should adopt)

1. **Modes** — adopt suggest/review/autofix + safe set (never auto-mutate geometry/tokens/components).
2. **Checkpoint previews** — export_shape + human OK at every step (the "One Rule").
3. **Self-review loop** — 7-axis design-quality scoring before declaring a screen done.
4. **Router** — dispatch to exactly one skill (no one-shot).
5. **Audit skills** — reuse `penpot-audit-accessibility` / `penpot-audit-tokens` as the *independent* critics (fixes gap 4).

---

## Item 6 — Journey Design (18-field) is a governed flow input

**Date:** 2026-09-27
**Status:** established (review-ready, awaiting direction decision)

### What was saved

`derived/journey-design.yaml` — the authoritative 18-field journey specification
(Persona → Goal → Trigger → Context → Phase → User action → Intent/thought → Touchpoint →
Information needed → Decision → System response → Business rule → Success/Failure state →
Recovery → Emotion/friction → Metric → Resulting UI), for the 7 core B2C/B2B journeys,
with **A/B/C variation** on the direction-sensitive fields.

### How it impacts the flow

```
derived/journey-design.yaml  (18-field DESIGN — authoritative)
   → derived/journey-graph.yaml   (executable nodes: user action/system response/success/failure/recovery → next)
   → experience/design/design-ir.yaml (Resulting UI → screens + components per node)
   → Penpot build                   (draw the screens)
```

The executable journey graph, Design IR, and Penpot screens are now **derived from** this
design — not from the shallow archetype templates. This replaces the 6 single-node
journey stubs and the all-`customer-app` surface mapping (defect logged in Item 1 §7, gap 3).

### Still open

- 6 seller/ops journeys are `required_not_designed` (no screens yet) — to be designed in M2/final.
- A `journey-design` schema + content-level validator is part of Item 4-A (so the flow *enforces* this richness, not just accepts it).
- Direction pick (A/B/C/hybrid) is still the **human decision** (Step 19) — recorded next.
