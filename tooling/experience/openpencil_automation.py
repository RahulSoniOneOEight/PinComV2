"""OpenPencil design-source automation.

Rebuild of ``penpot_automation`` on top of the local OpenPencil CLI.

The former Penpot implementation pushed semantic operations to an HTTP endpoint
(``PENPOT_WRITE_URL`` + ``PENPOT_TOKEN``) and read the observed revision back
from that service. OpenPencil is local and headless, so:

* the *write* direction is the OpenPencil editor/CLI producing a committed
  design file (``.fig``/``.pen``); :func:`build_operations` emits the semantic
  operation payload for that authoring step;
* the *observe* direction reads the committed design file directly with
  ``openpencil find`` / ``openpencil info`` — no endpoint and no token.

Legacy compatibility: the registry block may be named ``openpencil`` or the
legacy ``penpot``. Evidence is written as ``openpencil-*.yaml`` and the bridge
continues to read ``penpot-*.yaml`` for clients that have not been migrated.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any, Callable
import yaml

from tooling.experience.openpencil_bridge import (
    OPENPENCIL_MANIFEST,
    OPENPENCIL_OBSERVED,
    PROVIDER_OPENPENCIL,
    OpenPencilBridgeError,
    build_manifest,
)

ROOT = Path(__file__).resolve().parents[2]

#: Executable used to talk to OpenPencil. Override with OPENPENCIL_BIN.
DEFAULT_BIN = os.getenv("OPENPENCIL_BIN", "openpencil")

Runner = Callable[[list[str]], Any]


class OpenPencilAutomationError(RuntimeError):
    pass


#: Deprecated alias kept for existing imports.
PenpotAutomationError = OpenPencilAutomationError


def _load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise OpenPencilAutomationError(f"Missing design automation input: {path}")
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise OpenPencilAutomationError(f"Expected mapping: {path}")
    return value


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def _platform_command(args: list[str]) -> list[str]:
    """Make a command runnable on the host.

    On Windows an npm-installed CLI is a ``.cmd``/``.ps1`` shim, which
    ``CreateProcess`` cannot execute directly — it has to go through ``cmd.exe``.
    On other platforms the command is returned unchanged.
    """
    if os.name != "nt":
        return args
    resolved = shutil.which(args[0])
    if resolved and resolved.lower().endswith((".cmd", ".bat")):
        return ["cmd", "/c", resolved, *args[1:]]
    if resolved:
        return [resolved, *args[1:]]
    return args


def _default_runner(args: list[str]) -> Any:
    proc = subprocess.run(_platform_command(args), capture_output=True, text=True)
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()[:400]
        raise OpenPencilAutomationError(f"openpencil {' '.join(args[1:3])} failed: {detail}")
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise OpenPencilAutomationError(f"openpencil returned non-JSON output: {exc}") from exc


def _names(records: Any) -> list[str]:
    if isinstance(records, dict):
        records = records.get("nodes") or records.get("items") or []
    return [str(r.get("name")) for r in records if isinstance(r, dict) and r.get("name")]


def _resolve_design_file(design_file: str | Path, root: Path, client_id: str | None = None) -> Path:
    candidate = Path(design_file)
    if candidate.is_absolute():
        return candidate
    from_root = root / candidate
    if from_root.exists() or client_id is None:
        return from_root
    return root / "client-projects" / client_id / candidate


def build_operations(client_id: str, root: Path = ROOT) -> dict[str, Any]:
    """Semantic authoring payload for the design tool (unchanged shape)."""
    p = root / "client-projects" / client_id
    master = _load(p / "experience" / "design" / "master-design-system.yaml")
    registry = _load(p / "experience" / "design" / "ui-implementation-registry.yaml")
    ir = _load(p / "experience" / "design" / "design-ir.yaml")
    graph = _load(p / "derived" / "journey-graph.yaml")
    components = []
    for item in registry.get("components", []):
        source = item.get("openpencil") or item.get("penpot") or {}
        components.append({
            "semantic_id": item["semantic_id"],
            "component": source.get("component"),
            "variants": source.get("variants", []),
        })
    screens = []
    for journey in ir.get("journeys", []):
        for node in journey.get("nodes", []):
            screens.append({
                "id": node["id"],
                "surface": node.get("surface"),
                "components": node.get("component_refs", []),
                "states": node.get("state_refs", []),
            })
    prototypes = []
    for journey in graph.get("journeys", []):
        prototypes.append({
            "journey": journey["id"],
            "nodes": [
                {"id": n["id"], "action": n["action"], "next": n.get("next", [])}
                for n in journey.get("nodes", [])
            ],
        })
    return {
        "client_id": client_id,
        "tokens": master.get("tokens", {}),
        "breakpoints": master.get("breakpoints", {}),
        "components": components,
        "screens": screens,
        "interactive_journeys": prototypes,
        "mode": "semantic-design-import",
    }


def observe(
    client_id: str,
    *,
    design_file: str | Path | None = None,
    root: Path = ROOT,
    runner: Runner | None = None,
    binary: str = DEFAULT_BIN,
) -> dict[str, Any]:
    """Read a committed OpenPencil design file and report what it contains.

    Components and journey-scoped screens are read with the OpenPencil CLI
    (``find --json``), and the document summary with ``info --json``.
    """
    manifest = build_manifest(client_id, design_file=design_file, root=root)
    if manifest.get("source") != PROVIDER_OPENPENCIL:
        raise OpenPencilAutomationError("observe() requires an OpenPencil design_file")

    design_path = _resolve_design_file(design_file, root, client_id)
    run = runner or _default_runner

    component_records = run([binary, "find", str(design_path), "--type", "COMPONENT", "--json"])
    frame_records = run([binary, "find", str(design_path), "--type", "FRAME", "--json"])
    info = run([binary, "info", str(design_path), "--json"])

    components = _names(component_records)
    frames = _names(frame_records)

    normalised_frames = {_normalise(name): name for name in frames}
    matched: dict[str, str] = {}
    for journey in manifest.get("required_journeys", []):
        key = _normalise(journey)
        if key in normalised_frames:
            matched[journey] = normalised_frames[key]
            continue
        hit = next((name for norm, name in normalised_frames.items() if key and key in norm), None)
        if hit:
            matched[journey] = hit

    return {
        "project_ref": manifest["project_ref"],
        "revision_ref": manifest["revision_ref"],
        "components": components,
        "journey_screens": list(matched.keys()),
        "matched_frames": matched,
        "frames": frames,
        "info": info,
        "source": PROVIDER_OPENPENCIL,
        "status": "observed",
    }


def observe_and_record(
    client_id: str,
    *,
    design_file: str | Path | None = None,
    root: Path = ROOT,
    runner: Runner | None = None,
    binary: str = DEFAULT_BIN,
) -> dict[str, Any]:
    """Observe the design file and write the manifest/observed evidence."""
    observed = observe(client_id, design_file=design_file, root=root, runner=runner, binary=binary)
    manifest = build_manifest(client_id, design_file=design_file, root=root)
    design = root / "client-projects" / client_id / "experience" / "design"
    design.mkdir(parents=True, exist_ok=True)
    (design / OPENPENCIL_OBSERVED).write_text(yaml.safe_dump(observed, sort_keys=False), encoding="utf-8")
    (design / OPENPENCIL_MANIFEST).write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")
    return {
        "project_ref": observed["project_ref"],
        "revision_ref": observed["revision_ref"],
        "components": observed["components"],
        "journey_screens": observed["journey_screens"],
        "status": "written",
        "manifest_ref": f"experience/design/{OPENPENCIL_MANIFEST}",
        "observed_ref": f"experience/design/{OPENPENCIL_OBSERVED}",
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Observe an OpenPencil design file and record design evidence")
    ap.add_argument("--client", required=True)
    ap.add_argument("--design-file", required=True)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--record", action="store_true")
    ap.add_argument("--bin", default=DEFAULT_BIN)
    a = ap.parse_args()
    try:
        if a.record:
            value = observe_and_record(a.client, design_file=a.design_file, root=a.root, binary=a.bin)
        else:
            value = observe(a.client, design_file=a.design_file, root=a.root, binary=a.bin)
        print(yaml.safe_dump(value, sort_keys=False))
        return 0
    except (OpenPencilAutomationError, OpenPencilBridgeError) as exc:
        print(f"openpencil-automation-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
