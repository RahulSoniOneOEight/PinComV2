from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> int:
    run(sys.executable, "tooling/validation/validate_repository.py")
    checks = [
        ("client-input", "client-projects/reference-retail/input/client-input.yaml"),
        ("solution", "client-projects/reference-retail/solution/solution-contract.yaml"),
        ("workflow-state", "client-projects/reference-retail/workflow/workflow-state.yaml"),
        ("ai-proposal", "client-projects/reference-retail/intelligence/ai/interpretation.yaml"),
        ("experience-direction", "client-projects/reference-retail/experience/directions/a.yaml"),
        ("prototype-manifest", "client-projects/reference-retail/experience/prototypes/a-manifest.yaml"),
        ("fixture-set", "client-projects/reference-retail/experience/fixtures/commerce-baseline.yaml"),
        ("build-identity", "client-projects/reference-retail/experience/builds/BLD-reference-retail-a-ref001.yaml"),
        ("capture-manifest", "client-projects/reference-retail/experience/visual-qa/CAP-BLD-reference-retail-a-ref001.yaml"),
        ("review-session", "client-projects/reference-retail/feedback/REV-BLD-reference-retail-a-ref001.yaml"),
        ("bugdrop", "client-projects/reference-retail/feedback/BUG-REF-001.yaml"),
        ("domain-event", "client-projects/reference-retail/production/integration/order-confirmed.event.yaml"),
        ("domain-command", "client-projects/reference-retail/production/integration/create-sales-order.command.yaml"),
        ("reconciliation-record", "client-projects/reference-retail/production/integration/order-to-erp.reconciliation.yaml"),
        ("provider-adapter", "platform/commerce/medusa/adapter.yaml"),
        ("provider-adapter", "platform/marketplace/mercur/adapter.yaml"),
        ("provider-adapter", "platform/erp/tryton/adapter.yaml"),
        ("provider-adapter", "platform/search/meilisearch/adapter.yaml"),
        ("provider-adapter", "platform/customer/chatwoot/adapter.yaml"),
        ("provider-adapter", "platform/automation/activepieces/adapter.yaml"),
        ("dead-letter", "client-projects/reference-retail/production/ops/dead-letter.yaml"),
        ("health-record", "client-projects/reference-retail/production/ops/tryton-health.yaml"),
    ]
    for contract_type, path in checks:
        run(sys.executable, "-m", "tooling.contracts.validator", contract_type, path)

    run(sys.executable, "-m", "tooling.ai.router", "--role", "strategy")
    run(sys.executable, "-m", "tooling.ai.router", "--role", "implementation")
    run(sys.executable, "-m", "tooling.onboarding.engine", "--client",
        "reference-retail", "--print-only")
    run(sys.executable, "-m", "tooling.experience.generator", "--client",
        "reference-retail", "--print-only")
    run(sys.executable, "-m", "tooling.workflow.runtime", "status",
        "--client", "reference-retail")
    run(sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v")
    print("All Agency Platform V2 validation gates passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
