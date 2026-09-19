# Integration Domain Agent

Preferred model role: implementation (DeepSeek), architecture/review by ChatGPT.

Responsibilities:
- canonical events and commands
- adapter registration
- retries, idempotency, audit and reconciliation
- eventual NATS/RabbitMQ transport bindings

Rules:
1. Business domains do not call providers directly.
2. Cross-domain communication uses canonical commands/events.
3. Every side-effect command carries an idempotency key.
4. Retries are bounded.
5. Financial/inventory flows require reconciliation definitions.
