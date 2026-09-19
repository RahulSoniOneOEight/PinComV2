from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    "README.md","AGENTS.md",".opencode/ai-routing.yaml",
    ".opencode/agents/architecture.md",".opencode/agents/implementation.md",
    ".opencode/agents/experience.md",".opencode/agents/visual-review.md",
    "docs/architecture.md","docs/client-delivery.md","docs/reuse-policy.md",
    "docs/onboarding-engine.md","docs/ai-operating-model.md","docs/experience-platform.md",
    "docs/prototype-runtimes.md","docs/review-visual-validation.md",
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
    "contracts/schemas/build-identity.schema.json",
    "contracts/schemas/review-session.schema.json",
    "contracts/schemas/bugdrop.schema.json",
    "contracts/schemas/capture-manifest.schema.json",
    "templates/ai-proposal.yaml","templates/experience-direction.yaml",
    "templates/prototype-manifest.yaml","templates/fixture-set.yaml",
    "templates/visual-qa.yaml","templates/bugdrop.yaml","templates/build-identity.yaml",
    "design-contract/tokens/foundation.yaml",
    "design-contract/tokens/semantic.yaml",
    "design-contract/themes/default.yaml",
    "design-contract/components/button.yaml",
    "design-contract/patterns/product-card.yaml",
    "design-contract/bindings/flutter/README.md",
    "design-contract/bindings/web/README.md",
    "packages/agency_flutter_ui/README.md",
    "packages/agency_flutter_ui/pubspec.yaml",
    "packages/agency_flutter_ui/lib/agency_flutter_ui.dart",
    "packages/agency_flutter_ui/test/product_card_test.dart",
    "packages/agency_web_ui/README.md",
    "packages/agency_web_ui/package.json",
    "packages/agency_web_ui/src/index.tsx",
    "apps/prototype_app/pubspec.yaml",
    "apps/prototype_app/lib/main.dart",
    "apps/prototype_app/test/widget_test.dart",
    "apps/widgetbook/pubspec.yaml",
    "apps/widgetbook/lib/main.dart",
    "apps/storefront/package.json",
    "apps/storefront/app/page.tsx",
    "apps/storybook/package.json",
    "apps/storybook/stories/ProductCard.stories.tsx",
    "apps/review_mode/package.json",
    "apps/review_mode/app/page.tsx",
    "apps/review_mode/app/review/[client]/[review]/page.tsx",
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
    "tooling/experience/generator.py","tooling/review/session.py","tooling/review/bugdrop.py",
    "tests/test_review_tooling.py",
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
    "client-projects/reference-retail/experience/builds/BLD-reference-retail-a-ref001.yaml",
    "client-projects/reference-retail/experience/visual-qa/CAP-BLD-reference-retail-a-ref001.yaml",
    "client-projects/reference-retail/feedback/REV-BLD-reference-retail-a-ref001.yaml",
    "client-projects/reference-retail/feedback/BUG-REF-001.yaml",
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
