"""Capture harness: render a client's screens into the governed artifact layout.

Produces a capture manifest (``contracts/schemas/capture-manifest.schema.json``)
plus one PNG per screen under ``review/artifacts/<capture_id>/<surface>/<viewport>/<state>.png``.

Two sources are supported and they are NOT equivalent:

``design``
    Exports the committed OpenPencil document. This is a *design* capture: it proves
    what the design says, not what an app renders. Runtime is recorded as ``external``
    and the capture id is prefixed ``DESIGN-`` so a design export can never be mistaken
    for a build capture.

``build``
    Intended for a running app (Flutter golden tests or a served web app). Not
    implemented here — it raises rather than silently returning design captures.

KNOWN BLOCKER (OpenPencil CLI 0.15.1, Windows)
----------------------------------------------
``openpencil export`` cannot rasterise on this machine. The CLI joins the working
directory's *drive root* onto an already-absolute resolved path, producing
``D:\\C:\\Users\\...`` (from D:) or ``C:\\C:\\Users\\...`` (from C:), so CanvasKit
never loads::

    failed to asynchronously prepare wasm: ENOENT ... '<root>:\\C:\\Users\\...\\canvaskit.wasm'

It is not fixable by changing the working directory. The working route for design
renders is the OpenPencil MCP ``export_image`` tool, which does not hit this path.
``run_captures`` therefore reports ``status: failed`` with the real per-screen error
rather than pretending to have captured anything.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = Path("review") / "artifacts"
VIEWPORT = "390x844"

#: Screen frames are phone artboards. Anything at least this tall is treated as a screen.
MIN_SCREEN_HEIGHT = 800

DEFAULT_BIN = os.getenv("OPENPENCIL_BIN", "openpencil")
FIND_LIMIT = os.getenv("OPENPENCIL_FIND_LIMIT", "10000")

#: Capture format. SVG is the default because the CLI's PNG rasteriser is broken in
#: 0.15.1 on Windows (CanvasKit path corruption, see the module docstring). SVG needs no
#: CanvasKit, works per-node, and is resolution-independent, which suits drift detection.
#: Set OPENPENCIL_CAPTURE_FORMAT=png on a platform where raster export works.
CAPTURE_FORMAT = os.getenv("OPENPENCIL_CAPTURE_FORMAT", "svg").lower()

#: Screen-name fragments mapped to the surface they belong to. First match wins.
SURFACE_HINTS = (
    ("web store", "web-store"),
    ("analytics", "analytics"),
    ("ops console", "ops-console"),
    ("superadmin", "superadmin"),
    ("seller", "seller-portal"),
    ("marketplace", "commerce-admin"),
    ("admin", "commerce-admin"),
    ("settlement", "erp"),
    ("b2b", "b2b"),
    ("trade", "b2b"),
    ("rfq", "b2b"),
    ("quotation", "b2b"),
    ("credit", "b2b"),
    ("procurement", "b2b"),
)

# Screen-number ownership is part of the client contract.  Do not infer these from
# title words: for example, S65 contains "seller" but is a B2B buyer screen.
B2B_SCREEN_NUMBERS = {
    9, 10, 11, *range(27, 33), 35, 40, *range(51, 70),
}

WEB_PREFIXES = {
    "WEB": "web-store",
    "AN": "analytics",
    "OPS": "ops-console",
    "SA": "superadmin",
}


class CaptureError(RuntimeError):
    pass


def _platform_command(args: list[str]) -> list[str]:
    """Route npm .cmd shims through cmd.exe on Windows; see openpencil_automation."""
    if os.name != "nt":
        return args
    resolved = shutil.which(args[0])
    if resolved and resolved.lower().endswith((".cmd", ".bat")):
        return ["cmd", "/c", resolved, *args[1:]]
    if resolved:
        return [resolved, *args[1:]]
    return args


def _run_json(args: list[str]) -> Any:
    proc = subprocess.run(_platform_command(args), capture_output=True, text=True)
    if proc.returncode != 0:
        raise CaptureError(f"{' '.join(args[1:4])} failed: {(proc.stderr or proc.stdout).strip()[:300]}")
    return json.loads(proc.stdout)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def surface_for(screen_name: str) -> str:
    lowered = screen_name.lower()

    # Named desktop surfaces use stable prefixes in the design brief.
    prefix = re.match(r"^([A-Za-z]+)-\d+\b", screen_name.strip())
    if prefix and prefix.group(1).upper() in WEB_PREFIXES:
        return WEB_PREFIXES[prefix.group(1).upper()]

    # W-B2B-* must be resolved before the generic web-name hints.
    if re.match(r"^W-B2B-", screen_name, re.IGNORECASE):
        return "b2b"

    # The two original web shells predate the prefixed naming convention.
    if re.match(r"^W1\b", screen_name, re.IGNORECASE):
        return "commerce-admin"
    if re.match(r"^W2\b", screen_name, re.IGNORECASE):
        return "seller-portal"

    screen = re.match(r"^S(\d+)([A-Za-z]*)\b", screen_name.strip())
    if screen:
        number = int(screen.group(1))
        suffix = screen.group(2).upper()
        if (number == 8 and suffix.startswith("C")) or number in B2B_SCREEN_NUMBERS:
            return "b2b"

    for fragment, surface in SURFACE_HINTS:
        if fragment in lowered:
            return surface
    return "customer-app"


def screen_frames(document: Path, binary: str = DEFAULT_BIN) -> list[dict[str, Any]]:
    """Return the phone-sized screen frames of a document, in a stable order."""
    frames = _run_json([binary, "find", str(document), "--type", "FRAME", "--limit", FIND_LIMIT, "--json"])
    screens = [
        f for f in frames
        if isinstance(f, dict) and (f.get("height") or 0) >= MIN_SCREEN_HEIGHT
    ]
    return sorted(screens, key=lambda f: (str(f.get("name") or ""), str(f.get("id") or "")))


def plan_captures(client_id: str, root: Path = ROOT) -> tuple[str, str, list[dict[str, Any]], Path]:
    """Return (capture_id, direction_id, targets, document) for a design-source capture."""
    design = root / "client-projects" / client_id / "experience" / "design"
    manifest_path = design / "openpencil-manifest.yaml"
    if not manifest_path.exists():
        raise CaptureError(f"Missing design manifest: {manifest_path}")
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    # openpencil-metrics are a legacy alias; prefer the legacy Penpot-era name too.
    document = Path(manifest.get("project_ref") or "")
    if not document.is_absolute():
        document = root / document
    if not document.exists():
        raise CaptureError(f"Missing design document: {document}")

    revision = str(manifest.get("revision_ref") or "")
    capture_id = "DESIGN-" + (revision.split(":")[-1][:8] or "unknown")

    direction = "unset"
    for candidate in sorted((root / "client-projects" / client_id / "experience" / "directions").glob("*.yaml")):
        doc = yaml.safe_load(candidate.read_text(encoding="utf-8")) or {}
        if doc.get("direction_id"):
            direction = str(doc["direction_id"])
            break

    targets = []
    for frame in screen_frames(document):
        name = str(frame.get("name") or frame.get("id"))
        surface = surface_for(name)
        output = (ARTIFACTS / capture_id / surface / VIEWPORT / f"{slug(name)}.{CAPTURE_FORMAT}").as_posix()
        targets.append({
            "surface": surface,
            "runtime": "external",
            "viewport": VIEWPORT,
            "state": "default",
            "output": output,
            "screen": name,
            "node_id": frame.get("id"),
        })
    if not targets:
        raise CaptureError(f"No phone-sized screen frames found in {document}")
    return capture_id, direction, targets, document


def run_captures(client_id: str, root: Path = ROOT, binary: str = DEFAULT_BIN) -> dict[str, Any]:
    """Execute the planned exports and write the capture manifest."""
    capture_id, direction, targets, document = plan_captures(client_id, root)
    # A revision can be recaptured after classification changes.  Start its generated
    # artifact set clean so files cannot remain under a surface they no longer belong to.
    capture_root = root / ARTIFACTS / capture_id
    if capture_root.exists():
        shutil.rmtree(capture_root)
    for candidate in targets:
        out = root / candidate["output"]
        out.parent.mkdir(parents=True, exist_ok=True)
        proc = subprocess.run(
            _platform_command([binary, "export", str(document), "--node",
                               str(candidate["node_id"]), "-f", CAPTURE_FORMAT, "-s", "1", "-o", str(out)]),
            capture_output=True, text=True)
        if proc.returncode != 0 or not out.exists():
            candidate["status"] = "failed"
            candidate["error"] = (proc.stderr or proc.stdout).strip()[:200]
        else:
            candidate["status"] = "captured"
            candidate["sha256"] = hashlib.sha256(out.read_bytes()).hexdigest()
            candidate["bytes"] = out.stat().st_size

    captured = [t for t in targets if t.get("status") == "captured"]
    manifest = {
        "capture_id": capture_id,
        "client_id": client_id,
        "build_id": capture_id,
        "direction_id": direction,
        "source": "design-export",
        "note": ("Design captures exported from the committed OpenPencil document. These prove the "
                 "design, not a running app; runtime checks still require a build capture."),
        "targets": [
            {k: v for k, v in t.items() if k in {"surface", "runtime", "viewport", "state", "output"}}
            for t in targets
        ],
        "results": targets,
        "status": "captured" if captured else "failed",
    }
    out_path = root / "client-projects" / client_id / "experience" / "visual-qa" / f"CAP-{capture_id}.yaml"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(yaml.safe_dump(manifest, sort_keys=False, allow_unicode=True), encoding="utf-8")
    manifest["manifest_path"] = str(out_path.relative_to(root))
    manifest["captured"] = len(captured)
    manifest["failed"] = len(targets) - len(captured)
    return manifest


def main() -> int:
    ap = argparse.ArgumentParser(description="Capture client screens into review/artifacts")
    ap.add_argument("--client", required=True)
    ap.add_argument("--source", choices=["design", "build"], default="design")
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--bin", default=DEFAULT_BIN)
    ap.add_argument("--plan-only", action="store_true")
    a = ap.parse_args()
    if a.source == "build":
        print("capture-error: build captures are not implemented; a running app is required")
        return 2
    try:
        if a.plan_only:
            capture_id, direction, targets, _doc = plan_captures(a.client, a.root)
            print(yaml.safe_dump({"capture_id": capture_id, "direction_id": direction,
                                  "screens": len(targets)}, sort_keys=False))
            return 0
        result = run_captures(a.client, a.root, a.bin)
    except CaptureError as exc:
        print(f"capture-error: {exc}")
        return 2
    print(yaml.safe_dump({k: result[k] for k in
                          ("capture_id", "captured", "failed", "manifest_path", "status")}, sort_keys=False))
    return 0 if result["captured"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
