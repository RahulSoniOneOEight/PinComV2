# Release Note — client101 (BuildKart) Phase 1 + PinCommerce Platform Robustness

**Date:** 2026-09-27
**Branch:** `client101-phase1-bootstrap`

## Summary

Completed the design-first Phase 1 lifecycle (Steps 1–45) for client101 with **substantive** evidence — and hardened the PinCommerce platform so hollow artifacts no longer pass. Result: **45/45 via a deepened validator**, `design_gate: allowed`, **262 tests OK**.

## Platform updates

| ID | Change | File |
|---|---|---|
| **A** | Validator depth — `phase1_45` now checks *substance* (journey ≥2 nodes, reference `reason`+`implementation_target`, ≥20 icons/≥8 motions, visual-QA *run* not `not-run`, independent critic `reviewer`, real direction selection) instead of file existence | `tooling/orchestrator/phase1_45.py` |
| **B** | Deep source analysis — new Flutter/Dart analyzer (widgets, props, colors, font sizes, screens, navigation) | `tooling/experience/source_analyzers/flutter.py` |
| **C** | Journey engine — 5 missing seller/ops journey templates, actor mapping (`marketplace-order`→operator), actor-surface precedence; surface-map merges client-confirmed surfaces (`b2b`, `ops-console`) | `tooling/intelligence/journey_engine.py`, `tooling/onboarding/engine.py` |
| **D** | Independent critics — critics now carry a `reviewer` field (builders can't self-approve) | `tooling/experience/critics.py` |
| **F** | Design system — 26 governed icons, 8 motion contracts, AC direction bound to a theme preset | client101 artifacts |

## Client101 result

- Journey graph: all 13 journeys executable (was 6 single-node stubs), correct actor→surface mapping.
- References: 5 sources reclassified from filename-heuristic to real semantic mapping — e.g. Medusa UI **752 hollow ADAPT → 35 ADAPT-with-target + 761 REJECT**.
- Direction: `DIR-CLIENT101-AC` selected (human: RS, Project Lead).
- Design system: components, tokens, icons, motion, Penpot `piv2@49` bound.
- Review + freeze: `EXP-client101-piv2-49` approval, `BASE-client101-v1` scope baseline (human: RS).

## Honest caveats

1. **Visual QA is partially run** — 6 deterministic sub-checks verified; 9 visual checks (hierarchy, density, responsive, imagery, cross-platform parity…) remain `not-run` and require a human/multimodal visual review (the executing model has no image input).
2. **Reference decisions are deterministic** (keyword→semantic mapping), a defensible baseline; the fine-grained REUSE/ADAPT judgment should still be validated by a ChatGPT-routed or human reviewer.

## Tests

- New: `test_phase1_quality.py` (5), `test_journey_engine.py` (3), `test_flutter_analyzer.py` (5).
- Full suite: **262 tests, OK**.

## Changed files

**Platform (source):** `phase1_45.py`, `journey_engine.py`, `onboarding/engine.py`, `critics.py`, `source_analyzers/` (new).
**Tests:** `test_phase1_quality.py`, `test_journey_engine.py`, `test_flutter_analyzer.py` (new).
**Client:** `client-projects/client101/` (full workspace: input, derived, experience, references, review, QA, approved, changes).

## Next (human-gated)

1. Visual review of the 15 exported captures (`experience/captures/`) → mark remaining VQA checks.
2. Validate the reference ADAPT/REJECT calls (ChatGPT/human reviewer).
3. M2 — build the design system in Penpot (Penpot AI Kit) → final prototype.
