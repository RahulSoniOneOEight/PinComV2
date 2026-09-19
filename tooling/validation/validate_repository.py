from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    "README.md",
    "AGENTS.md",
    "docs/architecture.md",
    "docs/client-delivery.md",
    "docs/reuse-policy.md",
    "docs/onboarding-engine.md",
    "workflows/lifecycle.yaml",
    "contracts/schemas/client-input.schema.json",
    "contracts/schemas/solution-contract.schema.json",
    "contracts/schemas/workflow-state.schema.json",
    "contracts/schemas/change-contract.schema.json",
    "contracts/schemas/review-artifact.schema.json",
    "platform/provider-registry.yaml",
    "platform/default-provider-rules.yaml",
    "connectors/provider-registry.yaml",
    "intelligence/industries/retail/profile.yaml",
    "intelligence/archetypes/d2c-commerce.yaml",
    "intelligence/archetypes/b2b-commerce.yaml",
    "intelligence/capabilities/return-refund.yaml",
    "intelligence/journeys/browse-to-buy.yaml",
    "intelligence/entities/order.yaml",
    "intelligence/surfaces/customer-app.yaml",
    "intelligence/dependencies/return-refund.yaml",
    "tooling/onboarding/engine.py",
    "tooling/workflow/runtime.py",
    "tooling/contracts/validator.py",
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

print(
    f"Agency Platform V2 structural validation passed: "
    f"{len(REQUIRED)} required artifacts present."
)
