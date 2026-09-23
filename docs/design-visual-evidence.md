# Rendered Design Evidence

PinCommerce now treats rendered evidence as a CI artifact rather than a planning-only target.

The Design Visual Evidence workflow builds Storybook, renders the five governed patterns at mobile 390, tablet 768 and desktop 1440, captures PNG screenshots, runs axe accessibility analysis in the rendered browser, and records navigation/resource performance measurements.

Each capture records:
- screenshot SHA-256
- deterministic DOM/style fingerprint
- axe impact counts
- DOMContentLoaded timing
- transferred resource bytes
- viewport and story identity

PNG screenshots are uploaded as CI artifacts. Because repository text APIs cannot seed binary golden images, the deterministic regression gate currently uses DOM/style fingerprints. Approved binary PNG baselines remain a separate repository artifact and can be layered over this evidence without changing the capture contract.

The tournament layer consumes deterministic accessibility, performance, regression and completeness evidence. It may propose a review winner, but it cannot approve or promote a component; human review remains required.
