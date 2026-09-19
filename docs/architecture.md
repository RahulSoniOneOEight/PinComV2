# Agency Platform V2 Architecture

## Operating model
Client Truth → Industry/Archetype Benchmark → Capability Gap → Capability/Journey/Entity/Surface/Dependency maps → Solution Contract → Experience Directions → Multi-Surface Prototype → Review/Change Contract → Production Contracts → Domain Implementation → Integration/Automation/Data → Cross-Domain QA → UAT → Production Authorization → Release → Operations.

## Intelligence
- Design Intelligence
- Industry Intelligence
- Capability Intelligence
- Journey Intelligence
- Entity Intelligence
- Dependency Intelligence

## Production contracts
- Design Contract
- Business Contract
- Integration Contract
- Data Contract
- Solution Contract

## Engineering domains
- Experience
- Commerce
- Marketplace/B2B
- ERP
- Customer & Growth
- Integration & Connectors
- Automation & AI
- Data & Intelligence
- Platform / Infrastructure / Security

## Provider-neutral rule
Medusa, Mercur, Tryton, Chatwoot, Meilisearch, Activepieces and other systems are provider implementations selected by the Solution Contract, not architectural constants.

## Cross-system rule
Canonical ownership is defined in the Data Contract. Other systems consume projections/events. Cross-system commands must be idempotent and observable.
