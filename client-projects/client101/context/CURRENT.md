# Current Project Context — client101 (BuildKart)

This file is the compact restart context for OpenCode. Governed contracts and workflow state remain authoritative.

- Client: client101 (working title BuildKart; brand name unconfirmed)
- Notion intake: https://app.notion.com/p/3e6ddf8e5f6a80f3b201ff2474a374e4
- Canonical workflow state: read `../workflow/workflow-state.yaml`
- Phase-1 scope: combined D2C/B2C + B2B multi-seller marketplace, Tier-2 Indian markets (building materials / home-improvement trade)
- Business models: d2c + b2c + b2b + marketplace
- Core runtime intent: Medusa commerce, Mercur marketplace, Tryton ERP, NATS/event integration, provider-neutral payments/logistics
- Human gates (not auto-completable): Step 19 direction selection, Step 42 experience decision, Step 45 experience freeze
- External dependency: Penpot (no PENPOT_TOKEN/PENPOT_API_URL configured) — Steps 24 and review-package penpot_ref blocked
- Reference evidence gap: SRC-001/SRC-002 (Notion attachments Upload/Link Pending), SRC-004/SRC-005 (unresolved mentions); only SRC-003 (github.com/coderbaba0/flipkart_clone) has real ingested evidence
- Resume rule: validate canonical workflow state first; then load only the active phase contracts and evidence
- Do not: infer current truth from historical chat/session logs
