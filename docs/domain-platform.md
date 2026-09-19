# Domain Platform & Integration Runtime

Part 3B introduces provider-neutral operational domains.

## Boundary model

Experience / business capability
→ canonical command/event
→ Integration Runtime
→ provider adapter
→ external system

Provider-specific models stay behind adapters.

## Initial providers

- Commerce: Medusa
- Marketplace: Mercur
- ERP: Tryton
- Search: Meilisearch
- Customer Support: Chatwoot
- Automation: Activepieces

These are default provider candidates selected by the Solution Contract, not architectural requirements.

## Integration guarantees

The runtime provides:
- canonical commands/events
- idempotency
- bounded retries
- delivery audit
- correlation IDs
- reconciliation records

The current transport is injectable for deterministic tests. Live HTTP/NATS/RabbitMQ transports are a later deployment binding and require environment credentials/configuration.

## Reference flow

order.confirmed
→ erp.create_sales_order
→ Tryton adapter
→ reconciliation: commerce-order-to-erp

Other supported adapter boundaries include product search indexing, support conversation creation, automation flow triggers and seller synchronization.
