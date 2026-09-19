from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SCAN_SUFFIXES = {".py", ".yaml", ".yml", ".json", ".ts", ".tsx", ".dart", ".md"}

EXAMPLE_ENV_SUFFIXES = (".example", ".sample", ".template", ".dist")

PLACEHOLDER_MARKERS = (
    "your_",
    "your-",
    "yourapi",
    "changeme",
    "change-me",
    "change_me",
    "example",
    "placeholder",
    "dummy",
    "redacted",
    "xxxx",
    "todo",
    "sample",
    "fake",
    "insert_",
    "replace_",
    "not-a-real",
    "notreal",
    "test_only",
    "test-only",
    "test-secret",
    "<",
    ">",
    "${",
    "{{",
    "%s",
)

SECRET_KEY = r"(?:api[_-]?key|secret|token|password|access[_-]?key|private[_-]?key)"

QUOTED_PATTERN = re.compile(rf"(?i){SECRET_KEY}\s*[:=]\s*['\"]([^'\"]{{12,}})['\"]")
UNQUOTED_PATTERN = re.compile(rf"(?i){SECRET_KEY}\s*[:=]\s*([A-Za-z0-9_\-./+~]{{16,}})")
AWS_KEY_PATTERN = re.compile(r"AKIA[0-9A-Z]{16}")


def is_env_file(path: Path) -> bool:
    """Return True for environment files such as ``.env``, ``.env.local`` or ``foo.env``."""
    name = path.name.lower()
    return (
        name == ".env"
        or name.startswith(".env.")
        or name.endswith(".env")
        or ".env." in name
    )


def is_example_env(path: Path) -> bool:
    name = path.name.lower()
    return any(name.endswith(suffix) for suffix in EXAMPLE_ENV_SUFFIXES)


def _is_placeholder(value: str) -> bool:
    lowered = value.lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def find_secret(text: str, *, allow_unquoted: bool = False) -> str | None:
    """Return the first likely secret value found in ``text``, if any.

    Unquoted ``KEY=value`` assignments are only considered for environment files
    (``allow_unquoted=True``); in source code they produce false positives such as
    ``token=args.tryton_token``.
    """
    patterns = [QUOTED_PATTERN]
    if allow_unquoted:
        patterns.append(UNQUOTED_PATTERN)
    patterns.append(AWS_KEY_PATTERN)

    for pattern in patterns:
        for match in pattern.finditer(text):
            if pattern.groups == 0:
                return match.group(0)
            value = match.group(1)
            if not _is_placeholder(value):
                return value
    return None


def scan(root: Path = ROOT) -> list[str]:
    findings: list[str] = []
    ignored_parts = {
        ".git",
        "node_modules",
        ".next",
        "build",
        ".dart_tool",
        ".venv",
        "venv",
        "__pycache__",
    }
    root = Path(root)
    for current, dirnames, filenames in os.walk(root):
        # Prune ignored directories so we never descend into node_modules etc.
        dirnames[:] = [d for d in dirnames if d not in ignored_parts]
        for filename in filenames:
            path = Path(current) / filename
            if is_example_env(path):
                continue
            env_file = is_env_file(path)
            if not (env_file or path.suffix.lower() in SCAN_SUFFIXES):
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            if find_secret(text, allow_unquoted=env_file) is not None:
                findings.append(str(path.relative_to(root)))
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
