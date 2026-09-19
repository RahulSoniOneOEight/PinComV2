# Deployable Integration Infrastructure

Part 3B.2 turns the provider-neutral integration core into deployable infrastructure.

## Runtime components

- HTTP provider transport
- NATS event publishing abstraction
- SQLite durable idempotency/audit/dead-letter store
- webhook canonicalization
- bounded retry and dead-letter handling
- provider health checks
- Ops Console for delivery/reconciliation/provider-health exceptions

## Environment configuration

Use `infrastructure/environments/integration.example.yaml` as the shape for environment-specific configuration. Secrets are referenced by environment-variable name and must not be committed.

## Failure path

Command
→ retry
→ durable audit
→ dead letter after bounded attempts
→ Ops Console
→ operator review
→ governed replay/remediation

## Event path

Provider webhook
→ canonicalization
→ Domain Event
→ NATS subject
→ downstream subscribers

The NATS binding is client-injected, so tests do not require a live broker. Deployment can bind an actual NATS client without changing domain logic.

## Durable store

The initial durable implementation uses SQLite for local/dev/reference operation. Production environments can replace it with PostgreSQL or another durable store behind the same runtime boundary.
