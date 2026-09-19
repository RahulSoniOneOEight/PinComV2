# Onboarding & Benchmark Engine

Part 2 converts structured client input into a deterministic delivery blueprint.

## Input

`client-projects/<client>/input/client-input.yaml`

Core fields:
- client_id
- industry
- business_models
- goals
- requested_capabilities
- required_integrations
- existing_systems
- constraints
- geographies
- risk_profile

## Resolution flow

Client Input
→ classify business models into archetypes
→ load industry pack
→ load archetype packs
→ create benchmark baseline
→ compare requested capabilities to baseline
→ generate capability map
→ generate journey/surface maps
→ infer initial entity/dependency maps
→ apply default provider rules
→ generate reuse decisions
→ generate draft Solution Contract

## Commands

Preview without writing:

`python -m tooling.onboarding.engine --client reference-retail --print-only`

Generate new artifacts:

`python -m tooling.onboarding.engine --client <client-id>`

Regenerate existing artifacts intentionally:

`python -m tooling.onboarding.engine --client <client-id> --overwrite`

The deterministic engine provides a reproducible baseline. AI-assisted interpretation can be added later for ambiguous briefs, but generated project truth must remain explicit and reviewable.
