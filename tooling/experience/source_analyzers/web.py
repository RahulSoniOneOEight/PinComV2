"""Deep source analysis for Web (React/TSX/JSX) repositories.

Reads component source (not file paths) and extracts design evidence:
components (function/const/class), props, color tokens (hex + CSS vars), and
routes/navigation (journey) edges. Heuristic (regex) — feeds the reference
decide step with real evidence.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_FUNC_RE = re.compile(r"(?:export\s+default\s+)?(?:function|const)\s+([A-Z]\w*)")
_CLASS_RE = re.compile(r"class\s+([A-Z]\w*)\s+extends\s+(?:React\.)?(?:Component|PureComponent)")
_PROP_RE = re.compile(r"(?:const|let)\s*\{([^}]+)\}\s*=\s*props")
_JSX_PROPS_RE = re.compile(r"\b([a-zA-Z]+)\s*=\s*\{[^}]+\}")
_HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b")
_CSS_VAR_RE = re.compile(r"var\(\s*(--[\w-]+)")
_TAILWIND_COLOR_RE = re.compile(r"\b(bg|text|border|ring|from|to|via)-([\w-]+)-\d{2,3}\b")
_ROUTE_RE = re.compile(r"<Route[^>]+path\s*=\s*['\"`]([^'\"`]+)")
_NEXT_ROUTE_RE = re.compile(r"(?:useRouter\(\)\.push|router\.push)\(\s*['\"`]([^'\"`]+)")
_LINK_RE = re.compile(r"<(?:Link|a)[^>]*(?:to|href)\s*=\s*['\"`]([^'\"`]+)")

_ROLE_BY_NAME = {
    "product": "product", "search": "search", "cart": "cart", "checkout": "checkout",
    "button": "action", "form": "form", "list": "list", "nav": "navigation",
    "dialog": "overlay", "modal": "overlay", "tab": "navigation", "filter": "filter",
    "image": "media", "icon": "icon", "chart": "chart", "card": "surface",
}


def _role(name: str) -> str:
    if name.endswith(("Page", "Screen")):
        return "screen"
    low = name.lower()
    for key, role in _ROLE_BY_NAME.items():
        if key in low:
            return role
    return "component"


def analyze_web(source: str, file_path: str = "") -> dict[str, Any]:
    """Extract design evidence from a single JSX/TSX source file."""
    names: set[str] = set()
    for m in _FUNC_RE.finditer(source):
        names.add(m.group(1))
    for m in _CLASS_RE.finditer(source):
        names.add(m.group(1))

    components: list[dict[str, Any]] = []
    for name in sorted(names):
        components.append({
            "id": name,
            "name": name,
            "kind": "react-component",
            "role": _role(name),
            "props": [],
            "screen": name.endswith(("Page", "Screen")),
        })

    colors = sorted({f"#{h}" for h in _HEX_RE.findall(source)})
    css_vars = sorted(set(_CSS_VAR_RE.findall(source)))
    tailwind = sorted({f"tailwind:{m.group(1)}-{m.group(2)}" for m in _TAILWIND_COLOR_RE.finditer(source)})

    navigation = sorted(
        set(_ROUTE_RE.findall(source))
        | set(_NEXT_ROUTE_RE.findall(source))
        | {href for href in _LINK_RE.findall(source) if href.startswith("/")}
    )

    return {
        "file": file_path,
        "components": components,
        "colors": {f"color_{i+1}": c for i, c in enumerate(colors)},
        "css_variables": css_vars,
        "tailwind_tokens": tailwind,
        "navigation": navigation,
        "component_count": len(components),
    }


def analyze_directory(directory: Path) -> dict[str, Any]:
    directory = Path(directory)
    components: list[dict[str, Any]] = []
    colors: dict[str, str] = {}
    css_vars: set[str] = set()
    tailwind: set[str] = set()
    navigation: set[str] = set()

    for path in sorted(directory.rglob("*.tsx")) + sorted(directory.rglob("*.jsx")):
        if "node_modules" in path.parts or path.name.endswith((".test.tsx", ".test.jsx")):
            continue
        try:
            source = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        result = analyze_web(source, str(path))
        components.extend(result["components"])
        colors.update(result["colors"])
        css_vars.update(result["css_variables"])
        tailwind.update(result["tailwind_tokens"])
        navigation.update(result["navigation"])

    return {
        "components": components,
        "colors": colors,
        "css_variables": sorted(css_vars),
        "tailwind_tokens": sorted(tailwind),
        "navigation": sorted(navigation),
        "component_count": len(components),
    }
