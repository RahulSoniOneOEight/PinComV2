"""OpenPencil design-source bridge.

Extracted from the former Penpot bridge. OpenPencil is a local, MIT-licensed,
headless design editor; a design revision is a repository file (``.fig`` or
``.pen``) and its revision reference is the content hash of that file.

Backwards compatibility
-----------------------
Projects that were onboarded against Penpot keep working: the evidence-file
resolution helpers below prefer the OpenPencil names and fall back to the
legacy ``penpot-*`` names, and :func:`resolve_design_ref` accepts either the
``openpencil_ref`` or the legacy ``penpot_ref`` field on a review package.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any
import yaml

ROOT = Path(__file__).resolve().parents[2]

#: Design evidence file names, preferred first. Legacy Penpot names are still
#: accepted so existing client projects keep validating.
MANIFEST_NAMES = ("openpencil-manifest.yaml", "penpot-manifest.yaml")
OBSERVED_NAMES = ("openpencil-observed.yaml", "penpot-observed.yaml")

#: Canonical evidence file names written for new clients.
OPENPENCIL_MANIFEST = "openpencil-manifest.yaml"
OPENPENCIL_OBSERVED = "openpencil-observed.yaml"

#: Design-source providers understood by the bridge.
PROVIDER_OPENPENCIL = "openpencil-cli"
PROVIDER_LEGACY = "legacy-design-source"


class OpenPencilBridgeError(RuntimeError):
    pass


#: Deprecated alias kept so existing imports keep working during migration.
PenpotBridgeError = OpenPencilBridgeError


def _load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise OpenPencilBridgeError(f"Missing design bridge input: {path}")
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise OpenPencilBridgeError(f"Expected mapping: {path}")
    return value


def _hash(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def file_revision_ref(design_file: Path) -> str:
    """Deterministic revision reference for a design file."""
    return "sha256:" + hashlib.sha256(design_file.read_bytes()).hexdigest()


def design_evidence_paths(project_dir: Path) -> tuple[Path | None, Path | None]:
    """Resolve (manifest, observed) evidence, preferring OpenPencil over legacy Penpot."""
    design = project_dir / "experience" / "design"
    manifest = next((design / name for name in MANIFEST_NAMES if (design / name).exists()), None)
    observed = next((design / name for name in OBSERVED_NAMES if (design / name).exists()), None)
    return manifest, observed


def resolve_design_ref(document: dict[str, Any]) -> str | None:
    """Return the design revision reference from a review package or approval.

    Accepts the canonical ``openpencil_ref`` and the legacy ``penpot_ref``.
    """
    for key in ("openpencil_ref", "penpot_ref"):
        value = document.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def _resolve_design_file(design_file: str | Path, root: Path, client_id: str | None = None) -> Path:
    """Resolve a design file: absolute, repo-relative, or client-project-relative.

    The design file normally lives inside the client project
    (``experience/design/<name>.fig``), so a client-relative path is tried last.
    """
    candidate = Path(design_file)
    if candidate.is_absolute():
        return candidate
    from_root = root / candidate
    if from_root.exists() or client_id is None:
        return from_root
    return root / "client-projects" / client_id / candidate


def build_manifest(
    client_id: str,
    *,
    design_file: str | Path | None = None,
    revision_ref: str | None = None,
    project_ref: str | None = None,
    root: Path = ROOT,
) -> dict[str, Any]:
    """Build a design manifest from the governed repository inputs.

    ``design_file`` is an OpenPencil document (``.fig``/``.pen``), typically
    committed inside the client project. ``revision_ref`` defaults to the
    content hash of that file. When ``design_file`` is absent the bridge falls
    back to an external ``project_ref`` (legacy behaviour, e.g. Penpot) so
    previously onboarded clients keep producing manifests.
    """
    design_path = _resolve_design_file(design_file, root, client_id) if design_file else None
    if design_path is not None:
        if not design_path.exists():
            raise OpenPencilBridgeError(f"Missing OpenPencil design file: {design_path}")
        project_ref = project_ref or design_path.as_posix()
        revision_ref = revision_ref or file_revision_ref(design_path)
        source = PROVIDER_OPENPENCIL
    else:
        if not project_ref or not revision_ref:
            raise OpenPencilBridgeError("A design_file, or both project_ref and revision_ref, are required")
        source = PROVIDER_LEGACY

    p = root / "client-projects" / client_id
    design_ir = _load(p / "experience" / "design" / "design-ir.yaml")
    components = _load(p / "experience" / "design" / "component-contract-registry.yaml")
    theme = _load(p / "experience" / "design" / "theme-resolution.yaml")
    graph = _load(p / "derived" / "journey-graph.yaml")
    manifest = {
        "client_id": client_id,
        "project_ref": project_ref,
        "revision_ref": revision_ref,
        "source": source,
        "input_hashes": {
            "design_ir": _hash(design_ir),
            "components": _hash(components),
            "theme": _hash(theme),
            "journeys": _hash(graph),
        },
        "required_surfaces": design_ir.get("surfaces", []),
        "required_journeys": [x["id"] for x in design_ir.get("journeys", [])],
        "required_components": design_ir.get("components", []),
        "requirements": {
            # Journey evidence is journey-scoped screens (frames), not clickable
            # prototype interactions: OpenPencil (like the Penpot work it
            # replaces) organises the relevant screens spatially.
            "components_editable": True,
            "responsive_variants": ["mobile", "tablet", "desktop"],
            "states": ["default", "loading", "empty", "error", "success", "disabled"],
            "journey_screens": True,
        },
        "status": "external-design-required",
    }
    return manifest


def verify_manifest(manifest: dict[str, Any], observed: dict[str, Any]) -> list[str]:
    errors = []
    if observed.get("project_ref") != manifest.get("project_ref"):
        errors.append("Design project reference mismatch")
    if observed.get("revision_ref") != manifest.get("revision_ref"):
        errors.append("Design revision reference mismatch")
    observed_components = set(observed.get("components", []))
    missing = set(manifest.get("required_components", [])) - observed_components
    if missing:
        errors.append("Missing design components: " + ", ".join(sorted(missing)))
    # Canonical: journey_screens. Legacy evidence recorded interactive_journeys.
    observed_journeys = set(observed.get("journey_screens") or [])
    observed_journeys |= set(observed.get("interactive_journeys") or [])
    missing_journeys = set(manifest.get("required_journeys", [])) - observed_journeys
    if missing_journeys:
        errors.append("Missing journey screens: " + ", ".join(sorted(missing_journeys)))
    return errors
