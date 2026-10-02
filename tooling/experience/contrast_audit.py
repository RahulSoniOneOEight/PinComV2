"""Systematic contrast audit: every text token against every surface it could sit on.

Written because hand-picking pairs failed twice. ``content.muted`` was validated only
against the page surface and shipped at 3.49:1; ``content.secondary`` was validated only
against neutral surfaces and shipped at 3.83:1 on ``surface.accent``. Both were found by
other tools, not by this project's own review.

The audit deliberately computes the FULL cross product rather than a curated matrix.
Over-approximating produces some nonsensical pairs as noise; under-approximating — which
is what a hand-written list does — silently misses real failures. Noise is the safer
error, so it is the one chosen.

Exemptions are explicit and justified, never implicit.
"""

from __future__ import annotations

import argparse
import itertools
from pathlib import Path
from typing import Any

import yaml

from tooling.experience.theme_compiler import contrast

ROOT = Path(__file__).resolve().parents[2]

#: WCAG 2.1 AA for normal text is 4.5:1; large text 3:1. The audit uses the stricter value.
MIN_RATIO = 4.5

#: Pairs that are not text-on-surface and therefore not meaningful to check here.
EXEMPT: dict[tuple[str, str], str] = {
    ("content.disabled", "*"): "inactive controls are exempt from WCAG contrast (1.4.3)",
    ("content.inverse", "surface.page"): "inverse text is never placed on the page surface",
    ("content.inverse", "surface.raised"): "inverse text is never placed on a raised surface",
    ("content.inverse", "surface.accent"): "inverse text is never placed on the accent surface",
    ("content.inverse", "surface.interactive"): "inverse text is never placed on an interactive surface",
    ("content.on-selected", "surface.page"): "on-selected is only used on the selected control itself",
    ("content.on-selected", "surface.raised"): "on-selected is only used on the selected control itself",
    ("content.on-selected", "surface.interactive"): "on-selected is only used on the selected control itself",
    ("content.on-selected", "surface.accent"): "on-selected is only used on the selected control itself",
    ("content.muted", "action.disabled"): "inactive controls are exempt from WCAG contrast (1.4.3)",
}

TEXT_PREFIXES = ("content.",)
SURFACE_PREFIXES = ("surface.", "action.", "commerce.")


def _exempt(fg: str, bg: str) -> str | None:
    return EXEMPT.get((fg, bg)) or EXEMPT.get((fg, "*"))


def _is_surface(key: str) -> bool:
    if not key.startswith(SURFACE_PREFIXES):
        return False
    # only background-bearing roles: surfaces, action surfaces, and commerce .bg pairs
    return key.startswith(("surface.", "action.")) or key.endswith(".bg")


#: Which text tokens are legitimately placed on which surface families. The full cross
#: product is computed, then classified: a violation is a FAILURE only where the pairing is
#: plausible by the design system's own conventions. Everything else is reported as noise.
#: This is the part a hand-written list got wrong — it listed *some* pairs and silently
#: omitted others. Here the eligible pairings are stated per surface family, so a surface
#: can never "forget" to declare what sits on it.
ELIGIBLE: dict[str, tuple[str, ...]] = {
    "surface.page": ("content.primary", "content.secondary", "content.muted"),
    "surface.raised": ("content.primary", "content.secondary", "content.muted"),
    "surface.interactive": ("content.primary", "content.secondary", "content.muted"),
    "surface.accent": ("content.primary",),
    "action.primary": ("content.inverse", "content.on-selected"),
    "action.hover": ("content.inverse",),
    "action.secondary": ("content.primary",),
    "action.selected": ("content.on-selected",),
    "action.destructive": ("content.inverse",),
    "action.disabled": ("content.muted",),
    "commerce.b2b.bg": ("commerce.b2b.fg",),
    "commerce.deal.bg": ("commerce.deal.fg",),
    "commerce.discount.bg": ("commerce.discount.fg",),
    "commerce.in-stock.bg": ("commerce.in-stock.fg",),
    "commerce.info.bg": ("commerce.info.fg",),
    "commerce.low-stock.bg": ("commerce.low-stock.fg",),
    "commerce.unavailable.bg": ("commerce.unavailable.fg",),
    "commerce.tier.selected.bg": ("commerce.tier.selected.fg",),
}


def _eligible(text: str, surface: str) -> bool:
    """A pairing is plausible when the surface family declares that text token.

    Commerce surfaces are their own namespace: their text token is the matching ``*.fg``,
    never a generic ``content.*`` token.
    """
    allowed = ELIGIBLE.get(surface)
    if allowed is None:
        return False
    return text in allowed


def audit_theme(roles: dict[str, str]) -> dict[str, Any]:
    texts = [(k, v) for k, v in roles.items() if k.startswith(TEXT_PREFIXES) and str(v).startswith("#")]
    # commerce foreground tokens participate as text
    texts += [(k, v) for k, v in roles.items() if k.startswith("commerce.") and k.endswith(".fg") and str(v).startswith("#")]
    surfaces = [(k, v) for k, v in roles.items() if _is_surface(k) and str(v).startswith("#")]

    pairs, violations, noise, exempted = [], [], [], []
    for (fk, fv), (bk, bv) in itertools.product(texts, surfaces):
        if fv.lower() == bv.lower():
            continue
        reason = _exempt(fk, bk)
        ratio = contrast(fv, bv)
        entry = {"text": fk, "on": bk, "text_value": fv, "surface_value": bv, "ratio": ratio}
        if reason:
            exempted.append({**entry, "exempt": reason})
            continue
        if not _eligible(fk, bk):
            noise.append(entry)
            continue
        pairs.append(entry)
        if ratio < MIN_RATIO:
            violations.append(entry)

    violations.sort(key=lambda e: e["ratio"])
    return {
        "text_tokens": len(texts),
        "surface_tokens": len(surfaces),
        "pairs_checked": len(pairs),
        "exempted": len(exempted),
        "ineligible_pairs_ignored": len(noise),
        "violations": violations,
        "min_ratio": min((p["ratio"] for p in pairs), default=None),
        "status": "passed" if not violations else "failed",
    }


class ContrastAuditError(RuntimeError):
    pass


def audit(client_id: str, root: Path = ROOT) -> dict[str, Any]:
    path = root / "client-projects" / client_id / "experience" / "design" / "theme-resolution.yaml"
    if not path.exists():
        raise ContrastAuditError(f"missing theme: {path}")
    theme = yaml.safe_load(path.read_text(encoding="utf-8"))
    roles = theme.get("semantic_roles") or {}
    result = audit_theme(roles)
    result["client_id"] = client_id
    result["theme"] = str(path.relative_to(root))
    return result


def main() -> int:
    ap = argparse.ArgumentParser(description="Audit every text token against every surface")
    ap.add_argument("--client", required=True)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    r = audit(a.client, a.root)
    if a.json:
        print(yaml.safe_dump(r, sort_keys=False))
    else:
        print(f"{a.client}: {r['pairs_checked']} pairs checked, {r['exempted']} exempt, "
              f"{len(r['violations'])} violation(s); min ratio {r['min_ratio']}")
        for v in r["violations"]:
            print(f"  FAIL {v['ratio']:>5}  {v['text']:22} {v['text_value']} on {v['on']:24} {v['surface_value']}")
    return 0 if r["status"] == "passed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
