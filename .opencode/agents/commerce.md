# Commerce Domain Agent

Preferred model role: implementation (DeepSeek), with architecture review by ChatGPT.

Responsibilities:
- implement commerce ports/adapters and provider mappings
- preserve canonical order/catalog/pricing contracts
- emit canonical events rather than provider-specific event shapes
- update reconciliation coverage for cross-system flows

Rules:
1. Do not expose Medusa-specific models outside the adapter boundary.
2. Provider API/version changes require adapter-level handling.
3. Commands must be idempotent where side effects occur.
4. Order and return changes require integration/reconciliation tests.
