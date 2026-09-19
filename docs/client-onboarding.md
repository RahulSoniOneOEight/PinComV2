# Client Onboarding Runbook

## 1. Initialize the workspace

Example:

`python -m tooling.onboarding.init_client --client acme-retail --industry retail --business-model d2c --business-model b2b --capability catalogue --capability checkout --integration payment --integration logistics --geography india`

This creates:
- input/client-input.yaml
- workflow/workflow-state.yaml
- standard derived/solution/experience/feedback/change/approval/production/QA/UAT/release directories

## 2. Complete and validate intake

Edit the structured client input with the information gathered during discovery.

Validate:

`python -m tooling.contracts.validator client-input client-projects/acme-retail/input/client-input.yaml`

## 3. Advance intake stage

`python -m tooling.workflow.runtime advance --client acme-retail --actor <name>`

## 4. Generate the baseline delivery blueprint

Preview:

`python -m tooling.onboarding.engine --client acme-retail --print-only`

Write artifacts:

`python -m tooling.onboarding.engine --client acme-retail`

Outputs include:
- normalized client profile
- industry/archetype profile
- benchmark report
- capability gap
- reuse decisions
- capability map
- journey map
- entity map
- surface map
- dependency map
- draft Solution Contract

## 5. Human/strategy review

The generated blueprint is a deterministic baseline, not automatic client approval. Strategy/architecture review may:
- accept recommendations
- classify capabilities as later/not applicable
- add missing client-specific capabilities
- override provider candidates
- record exclusions and rationale

Only reviewed artifacts should progress toward experience directions and production contracts.
