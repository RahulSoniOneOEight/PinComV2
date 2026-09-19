# Reuse-First Policy

For every capability resolve in this order:
1. Existing client implementation
2. Existing PinCommerce/Agency capability
3. Existing approved UI/component/module
4. Existing approved open-source system/plugin
5. Configuration of an existing solution
6. Extension of an existing solution
7. Custom implementation

Every provider decision must record:
- capability
- selected provider/module
- license/operational review status
- integration boundary
- extension points
- replacement strategy

Preferred starting providers are examples, not hard requirements:
Medusa (commerce), Mercur (marketplace), Tryton (ERP), Chatwoot (support), Meilisearch (search), Activepieces/Windmill (automation), PostgreSQL/Supabase (data), NATS/RabbitMQ (messaging), Valkey (cache), PostHog/GA4 (analytics), Superset/Metabase (BI).
