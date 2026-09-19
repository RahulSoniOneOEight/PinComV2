from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{12,}['\"]"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
]


def scan(root: Path = ROOT) -> list[str]:
    findings: list[str] = []
    ignored_parts = {".git", "node_modules", ".next", "build", ".dart_tool"}
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in ignored_parts for part in path.parts):
            continue
        if path.suffix.lower() not in {".py",".yaml",".yml",".json",".ts",".tsx",".dart",".md",".env"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in PATTERNS:
            if pattern.search(text):
                findings.append(str(path.relative_to(root)))
                break
    return sorted(set(findings))


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan repository for likely committed secrets")
    parser.parse_args()
    findings = scan()
    if findings:
        print("Potential committed secrets found:")
        for finding in findings:
            print(f"- {finding}")
        return 1
    print("No likely committed secrets detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
