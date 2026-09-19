from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


def file_record(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": str(path.relative_to(ROOT)),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size": len(data),
    }


def build_sbom(root: Path = ROOT) -> dict[str, Any]:
    candidates = [
        root / "requirements-dev.txt",
        root / "requirements-production.txt",
        root / "package.json",
        root / "apps/storefront/package.json",
        root / "apps/review_mode/package.json",
        root / "apps/ops_console/package.json",
        root / "apps/prototype_app/pubspec.yaml",
        root / "packages/agency_flutter_ui/pubspec.yaml",
    ]
    components = [file_record(path) for path in candidates if path.exists()]
    return {
        "bomFormat": "CycloneDX-like",
        "specVersion": "0.1-reference",
        "components": components,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate deterministic dependency manifest")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    sbom = build_sbom()
    text = json.dumps(sbom, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
