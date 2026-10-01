from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any
import hashlib
import yaml

from tooling.experience.integrity import evaluate as evaluate_experience_integrity
from tooling.experience.openpencil_bridge import design_evidence_paths, resolve_design_ref

ROOT = Path(__file__).resolve().parents[2]

class DesignGateError(RuntimeError):
    pass

def _load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise DesignGateError(f"Missing design-gate artifact: {path}")
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise DesignGateError(f"Expected mapping: {path}")
    return value

def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def assert_build_allowed(client_id: str, root: Path = ROOT) -> dict[str, Any]:
    p = root / "client-projects" / client_id
    approval_path = p / "approved" / "experience-approval.yaml"
    approval = _load(approval_path)
    if approval.get("decision") != "approved" or approval.get("immutable") is not True:
        raise DesignGateError("Experience approval is not immutable/approved")
    package_path = p / approval["review_package_ref"]
    package = _load(package_path)
    if package.get("design_revision") != approval.get("design_revision"):
        raise DesignGateError("Approved design revision does not match review package")
    if package.get("source_revision") != approval.get("source_revision"):
        raise DesignGateError("Approved source revision does not match review package")
    design_ref = resolve_design_ref(package)
    if not design_ref:
        raise DesignGateError("Approved review package has no design revision (openpencil_ref)")
    design_ir_path = p / "experience" / "design" / "design-ir.yaml"
    component_registry_path = p / "experience" / "design" / "component-contract-registry.yaml"
    master_design_path = p / "experience" / "design" / "master-design-system.yaml"
    implementation_registry_path = p / "experience" / "design" / "ui-implementation-registry.yaml"
    icon_registry_path = p / "experience" / "design" / "icon-registry.yaml"
    motion_registry_path = p / "experience" / "design" / "motion-registry.yaml"
    manifest_path, observed_path = design_evidence_paths(p)
    design_ir = _load(design_ir_path)
    component_registry = _load(component_registry_path)
    master_design = _load(master_design_path)
    implementation_registry = _load(implementation_registry_path)
    icon_registry = _load(icon_registry_path)
    motion_registry = _load(motion_registry_path)
    if design_ir.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("Design IR is not review-ready/approved")
    if component_registry.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("Component contracts are not review-ready/approved")
    if master_design.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("Master design system is not review-ready/approved")
    if implementation_registry.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("UI implementation registry is not review-ready/approved")
    if icon_registry.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("Icon registry is not review-ready/approved")
    if motion_registry.get("status") not in {"review-ready","approved"}:
        raise DesignGateError("Motion registry is not review-ready/approved")
    if manifest_path is None or observed_path is None:
        raise DesignGateError("Design manifest/observed revision evidence is required")
    design_manifest = _load(manifest_path)
    design_observed = _load(observed_path)
    if design_manifest.get("revision_ref") != design_observed.get("revision_ref"):
        raise DesignGateError("Observed design revision does not match approved manifest")
    integrity = evaluate_experience_integrity(client_id, root)
    if integrity.get("status") != "passed":
        detail = "; ".join(integrity.get("blockers", [])[:8])
        raise DesignGateError("Experience integrity blocked: " + detail)
    return {
        "client_id": client_id,
        "allowed": True,
        "approval_id": approval["approval_id"],
        "design_revision": approval["design_revision"],
        "openpencil_ref": design_ref,
        "design_ir_sha256": _sha(design_ir_path),
        "component_registry_sha256": _sha(component_registry_path),
        "master_design_system_sha256": _sha(master_design_path),
        "implementation_registry_sha256": _sha(implementation_registry_path),
        "icon_registry_sha256": _sha(icon_registry_path),
        "motion_registry_sha256": _sha(motion_registry_path),
        "design_manifest_sha256": _sha(manifest_path),
        "design_observed_sha256": _sha(observed_path),
        "experience_integrity": integrity,
    }

def main() -> int:
    ap=argparse.ArgumentParser(description="Hard gate for client-facing production UI build")
    ap.add_argument("--client",required=True); ap.add_argument("--root",type=Path,default=ROOT)
    args=ap.parse_args()
    try:
        print(yaml.safe_dump(assert_build_allowed(args.client,args.root),sort_keys=False))
        return 0
    except DesignGateError as exc:
        print(f"design-gate-error: {exc}")
        return 2

if __name__=="__main__":
    raise SystemExit(main())
