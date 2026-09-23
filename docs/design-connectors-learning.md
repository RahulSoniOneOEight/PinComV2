# Design Connectors and Learning Operations

This layer turns the Stage 2 contracts into operating collectors.

## Source connectors

- Figma: authenticated `/v1/files/{file_key}` collection using `FIGMA_TOKEN`
- Penpot: configurable authenticated design-export endpoint using `PENPOT_API_URL` and `PENPOT_TOKEN`
- Reference sites: HTML metadata, stylesheet references and embedded color extraction
- all collected source data passes through the provenance-aware ingestion boundary

## Dependency collectors

The collector refreshes npm and pub.dev package metadata into deterministic snapshots consumed by dependency intelligence. Scheduled CI produces a snapshot artifact; the snapshot is evidence, not an automatic approval.

Security advisories remain an independent evidence field. The collector does not fabricate vulnerability status when an ecosystem source does not supply it.

## Production feedback and telemetry

Telemetry JSONL is aggregated per design target and evaluated against governed thresholds. Human client/design feedback is normalized as accepted, accepted-with-changes or rejected with reviewer identity.

The learning pipeline combines these records into bounded ranking adjustments. These adjustments modify advisory ranking only; they never promote, deploy or mutate an approved client design without human approval.
