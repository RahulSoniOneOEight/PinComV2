# Production Connectors & Live Reference Flow

Part 3B.3 adds production-facing connector contracts and live bindings while preserving provider-neutral domain contracts.

## Connectors

Payments:
- Razorpay
- Cashfree

Logistics:
- Shiprocket
- Delhivery

Messaging:
- Meta WhatsApp Cloud API

Each connector is represented by a provider-adapter contract. Provider-specific request/response mapping belongs inside the adapter/transport boundary.

## Production bindings

- PostgreSQL durable runtime store
- live NATS client binding
- HMAC webhook signature verification primitives
- authorized dead-letter replay
- reconciliation scheduler
- environment-driven HTTP transport

## Live reference harness

The Medusa→Tryton harness can be run with:

`TRYTON_BASE_URL=<url> TRYTON_TOKEN=<token> python -m tooling.integration.live_reference --order client-projects/reference-retail/production/integration/medusa-order.fixture.yaml`

No credentials are committed. The harness uses the canonical order event/command mapping and produces delivery + reconciliation output.

## Staging

`infrastructure/docker/docker-compose.staging.yml` provides PostgreSQL, NATS JetStream and Meilisearch as local/staging infrastructure dependencies.

Provider application containers such as Medusa/Tryton remain environment-specific and should be attached through the Solution Contract/deployment configuration rather than hard-coded into the base platform.
