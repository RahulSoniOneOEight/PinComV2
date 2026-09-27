"""Deep source analysis for Flutter/Dart repositories.

Reads Dart *source* (not file paths) and extracts design evidence:
widget/component classes, constructor props, color/typography tokens, screens,
and navigation (journey) edges. Heuristic (regex) rather than full AST — good
enough to feed the reference-intelligence decide step with real evidence.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

# --- tokenizers -----------------------------------------------------------

_WIDGET_RE = re.compile(r"class\s+(\w+)\s+extends\s+(StatelessWidget|StatefulWidget)")
_PROP_RE = re.compile(r"final\s+[\w<>,\s\?]+\s+(\w+)\s*[;=]")
_REQUIRED_PROP_RE = re.compile(r"required\s+this\.(\w+)")
_COLOR_RE = re.compile(r"Color\(0xFF([0-9A-Fa-f]{6,8})\)")
_HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b")
_FONT_SIZE_RE = re.compile(r"fontSize:\s*([\d.]+)")
_SCAFFOLD_RE = re.compile(r"\bScaffold\s*\(")
_NAVIGATOR_NAMED_RE = re.compile(r"Navigator\.pushNamed\([^)]*?['\"]/?([\w-]+)['\"]")
_NAVIGATOR_PUSH_RE = re.compile(r"Navigator\.push\([^)]*?=>\s*([A-Z]\w+)")
_ROUTE_RE = re.compile(r"['\"]/?([\w-]+)['\"]\s*:\s*\([^)]*\)\s*=>\s*([A-Z]\w+)")

_ROLE_BY_NAME = {
    "product": "product", "search": "search", "cart": "cart", "checkout": "checkout",
    "button": "action", "form": "form", "list": "list", "nav": "navigation",
    "dialog": "overlay", "tab": "navigation", "filter": "filter", "image": "media",
    "icon": "icon", "card": "surface",
}


def _role(name: str) -> str:
    if name.endswith(("Page", "Screen")):
        return "screen"
    low = name.lower()
    for key, role in _ROLE_BY_NAME.items():
        if key in low:
            return role
    return "component"


def analyze_dart(source: str, file_path: str = "") -> dict[str, Any]:
    """Extract design evidence from a single Dart source file."""
    components: list[dict[str, Any]] = []
    for m in _WIDGET_RE.finditer(source):
        name, kind = m.group(1), m.group(2)
        props: list[str] = []
        props.extend(_REQUIRED_PROP_RE.findall(source))
        props.extend(p for p in _PROP_RE.findall(source) if p not in props and p != name)
        components.append({
            "id": name,
            "name": name,
            "kind": kind,
            "role": _role(name),
            "props": sorted(set(props)),
            "stateful": kind == "StatefulWidget",
            "screen": bool(_SCAFFOLD_RE.search(source)),
        })

    colors = sorted({f"#{h}" for h in _HEX_RE.findall(source)} | {f"#{c}" for c in _COLOR_RE.findall(source)})
    font_sizes = sorted({float(f) for f in _FONT_SIZE_RE.findall(source)})

    navigation = sorted({
        *(_NAVIGATOR_NAMED_RE.findall(source)),
        *(_NAVIGATOR_PUSH_RE.findall(source)),
        *{name for name, _ in _ROUTE_RE.findall(source)},
    })

    return {
        "file": file_path,
        "components": components,
        "colors": {f"color_{i+1}": c for i, c in enumerate(colors)},
        "font_sizes": font_sizes,
        "navigation": navigation,
        "has_scaffold": bool(_SCAFFOLD_RE.search(source)),
    }


def analyze_directory(directory: Path) -> dict[str, Any]:
    """Walk a directory of Dart files and merge design evidence."""
    directory = Path(directory)
    components: list[dict[str, Any]] = []
    colors: dict[str, str] = {}
    font_sizes: set[float] = set()
    navigation: set[str] = set()
    screens: list[str] = []

    for path in sorted(directory.rglob("*.dart")):
        if "test" in path.parts or path.name.endswith("_test.dart"):
            continue
        try:
            source = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        result = analyze_dart(source, str(path))
        components.extend(result["components"])
        colors.update(result["colors"])
        font_sizes.update(result["font_sizes"])
        navigation.update(result["navigation"])
        if result["has_scaffold"] or path.name.lower().endswith(("page.dart", "screen.dart")):
            screens.append(path.name)

    return {
        "components": components,
        "colors": colors,
        "font_sizes": sorted(font_sizes),
        "navigation": sorted(navigation),
        "screens": sorted(set(screens)),
        "component_count": len(components),
        "screen_count": len(set(screens)),
    }
