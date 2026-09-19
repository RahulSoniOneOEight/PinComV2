from __future__ import annotations

import argparse
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
LIFECYCLE_PATH = ROOT / "workflows" / "lifecycle.yaml"


def load_lifecycle(path: Path = LIFECYCLE_PATH) -> list[dict]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    stages = data.get("stages", []) if isinstance(data, dict) else []
    if not isinstance(stages, list) or not stages:
        raise ValueError("Lifecycle must define at least one stage")
    return stages


def _unsafe_output(output: str) -> bool:
    path = Path(output)
    return (
        path.is_absolute()
        or output.startswith(("/", "\\", "~"))
        or "\\" in output
        or ".." in path.parts
    )


def validate_lifecycle(
    root: Path = ROOT,
    reference_client: str = "reference-retail",
) -> list[str]:
    """Validate the lifecycle configuration and that its outputs are real paths.

    Each configured output must be a safe, project-relative path that exists for
    the reference client project.
    """
    errors: list[str] = []
    stages = load_lifecycle(root / "workflows" / "lifecycle.yaml")
    project = root / "client-projects" / reference_client

    seen: set[str] = set()
    for stage in stages:
        stage_id = stage.get("id")
        output = stage.get("output")
        if not stage_id or not output:
            errors.append(f"stage missing id/output: {stage}")
            continue
        if stage_id in seen:
            errors.append(f"duplicate stage id: {stage_id}")
        seen.add(stage_id)
        if _unsafe_output(output):
            errors.append(f"unsafe lifecycle output for {stage_id}: {output}")
            continue
        if not (project / output).exists():
            errors.append(f"lifecycle output missing for {stage_id}: {output}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the canonical lifecycle configuration")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--client", default="reference-retail")
    args = parser.parse_args()

    errors = validate_lifecycle(args.root, args.client)
    if errors:
        print("Lifecycle validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Lifecycle configuration is valid; outputs exist for {args.client}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
