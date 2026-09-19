from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> int:
    run(sys.executable, "tooling/validation/validate_repository.py")
    run(
        sys.executable,
        "-m",
        "tooling.contracts.validator",
        "solution",
        "client-projects/reference-retail/solution/solution-contract.yaml",
    )
    run(
        sys.executable,
        "-m",
        "tooling.contracts.validator",
        "workflow-state",
        "client-projects/reference-retail/workflow/workflow-state.yaml",
    )
    run(
        sys.executable,
        "-m",
        "tooling.workflow.runtime",
        "status",
        "--client",
        "reference-retail",
    )
    run(sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v")
    print("All Agency Platform V2 validation gates passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
