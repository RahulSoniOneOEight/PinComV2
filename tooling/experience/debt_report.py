from __future__ import annotations

from pathlib import Path
from typing import Any

from tooling.experience.design_debt import scan


def build_report(root: Path) -> dict[str, Any]:
    result = scan(root)
    by_type: dict[str, int] = {}
    for finding in result["findings"]:
        kind = str(finding["type"])
        by_type[kind] = by_type.get(kind, 0) + 1
    return {**result, "by_type": dict(sorted(by_type.items()))}


def to_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Design Debt Report",
        "",
        "Status: **" + str(report["status"]) + "**",
        "Findings: **" + str(report["finding_count"]) + "**",
        "",
    ]
    for kind, count in report.get("by_type", {}).items():
        lines.append("- " + str(kind) + ": " + str(count))
    if report.get("findings"):
        lines.extend(["", "## Findings"])
        for item in report["findings"]:
            detail = item.get("path") or ", ".join(item.get("families", []))
            lines.append("- " + str(item.get("type")) + " — " + str(detail))
    return "\n".join(lines) + "\n"
