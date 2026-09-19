from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    "README.md","AGENTS.md",".opencode/ai-routing.yaml",
    ".opencode/agents/architecture.md",".opencode/agents/implementation.md",
    ".opencode/agents/experience.md",
    "docs/architecture.md","docs/client-delivery.md","docs/reuse-policy.md",
    "docs/onboarding-engine.md","docs/ai-operating-model.md","docs/experience-platform.md",
    "workflows/lifecycle.yaml",
    "contracts/schemas/client-input.schema.json",
    "contracts/schemas/solution-contract.schema.json",
    "contracts/schemas/workflow-state.schema.json",
    "contracts/schemas/change-contract.schema.json",
    "contracts/schemas/review-artifact.schema.json",
    "contracts/schemas/ai-proposal.schema.json",
    "contracts/schemas/experience-direction.schema.json",
    "contracts/schemas/prototype-manifest.schema.json",
    "contracts/schemas/fixture-set.schema.json",
    "contracts/schemas/visual-qa.schema.json",
    "templates/ai-proposal.yaml","templates/experience-direction.yaml",
    "templates/prototype-manifest.yaml","templates/fixture-set.yaml",
    "templates/visual-qa.yaml",
    "design-contract/tokens/foundation.yaml",
    "design-contract/tokens/semantic.yaml",
    "design-contract/themes/default.yaml",
    "design-contract/components/button.yaml",
    "design-contract/patterns/product-card.yaml",
    "design-contract/bindings/flutter/README.md",
    "design-contract/bindings/web/README.md",
    "packages/agency_flutter_ui/README.md",
    "packages/agency_web_ui/README.md",
    "platform/provider-registry.yaml","platform/default-provider-rules.yaml",
    "connectors/provider-registry.yaml",
    "intelligence/industries/retail/profile.yaml",
    "intelligence/archetypes/d2c-commerce.yaml",
    "intelligence/archetypes/b2b-commerce.yaml",
    "intelligence/capabilities/return-refund.yaml",
    "intelligence/journeys/browse-to-buy.yaml",
    "intelligence/entities/order.yaml",
    "intelligence/surfaces/customer-app.yaml",
    "intelligence/dependencies/return-refund.yaml",
    "tooling/onboarding/engine.py","tooling/workflow/runtime.py",
    "tooling/contracts/validator.py","tooling/ai/router.py","tooling/ai/proposals.py",
    "tooling/experience/generator.py",
    "client-projects/reference-retail/input/client-input.yaml",
    "client-projects/reference-retail/derived/client-profile.yaml",
    "client-projects/reference-retail/derived/benchmark-report.yaml",
    "client-projects/reference-retail/derived/capability-gap.yaml",
    "client-projects/reference-retail/derived/capability-map.yaml",
    "client-projects/reference-retail/derived/journey-map.yaml",
    "client-projects/reference-retail/derived/entity-map.yaml",
    "client-projects/reference-retail/derived/surface-map.yaml",
    "client-projects/reference-retail/derived/dependency-map.yaml",
    "client-projects/reference-retail/solution/solution-contract.yaml",
    "client-projects/reference-retail/workflow/workflow-state.yaml",
    "client-projects/reference-retail/intelligence/ai/interpretation.yaml",
    "client-projects/reference-retail/experience/directions/a.yaml",
    "client-projects/reference-retail/experience/directions/b.yaml",
    "client-projects/reference-retail/experience/directions/c.yaml",
    "client-projects/reference-retail/experience/prototypes/a-manifest.yaml",
    "client-projects/reference-retail/experience/prototypes/b-manifest.yaml",
    "client-projects/reference-retail/experience/prototypes/c-manifest.yaml",
    "client-projects/reference-retail/experience/fixtures/commerce-baseline.yaml",
    "review/artifact-contract.md",
]

missing = [p for p in REQUIRED if not (ROOT / p).exists()]
if missing:
    print("Missing required Agency Platform V2 artifacts:")
    for p in missing:
        print(f" - {p}")
    sys.exit(1)

for schema_path in (ROOT / "contracts" / "schemas").glob("*.json"):
    with schema_path.open(encoding="utf-8") as f:
        json.load(f)

print(f"Agency Platform V2 structural validation passed: {len(REQUIRED)} required artifacts present.")
