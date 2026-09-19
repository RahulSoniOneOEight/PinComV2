# Experience Platform

Part 3A converts governed solution artifacts into reviewable multi-surface experience directions.

## Inputs

- capability-map.yaml
- journey-map.yaml
- surface-map.yaml
- Design Contract
- approved AI/strategy proposals where relevant

## Generated outputs

- Direction A: discovery-first
- Direction B: search-first
- Direction C: task-first
- deterministic fixture set
- prototype manifests per direction

## Rules

Directions must differ materially in:
- navigation
- discovery
- task priority
- interaction model
- information density

They must not be simple color/theme variants.

## Commands

Preview:
`python -m tooling.experience.generator --client reference-retail --print-only`

Generate:
`python -m tooling.experience.generator --client <client-id>`

Regenerate intentionally:
`python -m tooling.experience.generator --client <client-id> --overwrite`

## Review pipeline

Direction → Prototype Build → Visual QA → Review Artifact → Client/Internal Review → Selection/Mix-and-Match → Change Contract where needed.

## Tooling

Flutter:
- agency_flutter_ui
- Widgetbook
- Golden Tests
- optional Nowa refinement

Web:
- agency_web_ui
- React / Next.js
- Storybook
- browser visual regression

OpenCode orchestrates the flow. ChatGPT is preferred for experience strategy/review; DeepSeek is preferred for implementation scaffolding and repetitive fixture/component generation.
