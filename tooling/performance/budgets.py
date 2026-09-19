from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]


def load_budgets(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def validate_measurements(
    budgets: dict[str, Any],
    measurements: dict[str, dict[str, float]],
) -> list[str]:
    errors: list[str] = []
    for app, limits in budgets.get("budgets", {}).items():
        if app not in measurements:
            errors.append(f"{app}: missing measurements")
            continue
        actual = measurements[app]
        for key, limit in limits.items():
            if key not in actual:
                errors.append(f"{app}.{key}: missing measurement")
            elif actual[key] > limit:
                errors.append(f"{app}.{key}: {actual[key]} > {limit}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate performance budgets")
    parser.add_argument("--measurements", type=Path, required=False)
    parser.add_argument("--budgets", type=Path, default=ROOT / "security/performance-budgets.yaml")
    args = parser.parse_args()
    budgets = load_budgets(args.budgets)
    if not args.measurements:
        print(yaml.safe_dump(budgets, sort_keys=False))
        return 0
    measurements = yaml.safe_load(args.measurements.read_text(encoding="utf-8"))
    errors = validate_measurements(budgets, measurements)
    if errors:
        for error in errors:
            print(error)
        return 1
    print("Performance budgets passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
