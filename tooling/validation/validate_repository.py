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
    "workflows/lifecycle.yaml",
    "contracts/schemas/solution-contract.schema.json",
    "platform/provider-registry.yaml",
    "connectors/provider-registry.yaml",
    "intelligence/industries/retail/profile.yaml",
    "intelligence/archetypes/d2c-commerce.yaml",
    "intelligence/capabilities/return-refund.yaml",
    "intelligence/journeys/browse-to-buy.yaml",
    "intelligence/entities/order.yaml",
    "intelligence/surfaces/customer-app.yaml",
    "intelligence/dependencies/return-refund.yaml",
    "client-projects/reference-retail/input/client-input.yaml",
    "client-projects/reference-retail/derived/client-profile.yaml",
    "client-projects/reference-retail/derived/benchmark-report.yaml",
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

with (ROOT / "contracts/schemas/solution-contract.schema.json").open(encoding="utf-8") as f:
    json.load(f)

print(f"Agency Platform V2 structural validation passed: {len(REQUIRED)} required artifacts present.")
