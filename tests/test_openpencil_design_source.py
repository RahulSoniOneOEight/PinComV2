"""Acceptance tests for the OpenPencil design-source rebuild.

Covers the new bridge and automation modules end to end with a stubbed
OpenPencil CLI, plus the backwards-compatibility shims that keep Penpot-era
imports working.
"""

from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.experience.openpencil_bridge import (
    build_manifest,
    design_evidence_paths,
    file_revision_ref,
    resolve_design_ref,
    verify_manifest,
)
from tooling.experience.openpencil_automation import build_operations, observe, observe_and_record


def _hashes(root: Path) -> None:
    """Design inputs the manifest hashes; values are irrelevant to the tests."""
    files = {
        "experience/design/design-ir.yaml": {
            "surfaces": ["web"],
            "components": ["commerce.product-card"],
            "journeys": [{"id": "browse-to-buy", "nodes": [{"id": "n1", "surface": "web"}]}],
            "status": "approved",
        },
        "experience/design/component-contract-registry.yaml": {"components": [{"id": "commerce.product-card"}]},
        "experience/design/theme-resolution.yaml": {"semantic_roles": {"surface.page": "#fff"}},
        "derived/journey-graph.yaml": {"journeys": [{"id": "browse-to-buy", "nodes": [{"id": "n1", "action": "go"}]}]},
    }
    for rel, value in files.items():
        path = root / "client-projects" / "c" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(yaml.safe_dump(value), encoding="utf-8")


def _stub_runner(design_file: str):
    """Mimic `openpencil find/info --json` output for the CLI surface we rely on."""

    def run(args):
        assert args[1] in {"find", "info"}, args
        if args[1] == "info":
            return {"pages": 1, "totalNodes": 42, "types": {"COMPONENT": 1, "FRAME": 2}}
        if "COMPONENT" in args:
            return [{"id": "0:1", "name": "ProductCard", "type": "COMPONENT"}]
        return [
            {"id": "0:10", "name": "B2C Home", "type": "FRAME"},
            {"id": "0:11", "name": "Browse to Buy", "type": "FRAME"},
        ]

    return run


class OpenPencilBridgeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        _hashes(self.root)
        self.design = self.root / "client-projects" / "c" / "experience" / "design" / "client.fig"
        self.design.write_bytes(b"openpencil-binary-fixture")

    def tearDown(self):
        self.tmp.cleanup()

    def test_manifest_revision_is_file_content_hash(self):
        manifest = build_manifest("c", design_file=self.design, root=self.root)
        self.assertEqual(manifest["source"], "openpencil-cli")
        self.assertEqual(manifest["revision_ref"], file_revision_ref(self.design))
        self.assertTrue(manifest["revision_ref"].startswith("sha256:"))
        self.assertEqual(manifest["required_journeys"], ["browse-to-buy"])
        self.assertTrue(manifest["requirements"]["journey_screens"])

    def test_observe_extracts_components_and_journey_screens(self):
        observed = observe("c", design_file=self.design, root=self.root, runner=_stub_runner(str(self.design)))
        self.assertIn("ProductCard", observed["components"])
        self.assertEqual(observed["journey_screens"], ["browse-to-buy"])
        self.assertEqual(observed["source"], "openpencil-cli")

    def test_observe_and_record_writes_openpencil_evidence(self):
        result = observe_and_record("c", design_file=self.design, root=self.root, runner=_stub_runner(str(self.design)))
        design = self.root / "client-projects" / "c" / "experience" / "design"
        self.assertTrue((design / "openpencil-manifest.yaml").exists())
        self.assertTrue((design / "openpencil-observed.yaml").exists())
        manifest, observed = design_evidence_paths(self.root / "client-projects" / "c")
        self.assertEqual(manifest.name, "openpencil-manifest.yaml")
        self.assertEqual(observed.name, "openpencil-observed.yaml")
        self.assertEqual(result["status"], "written")

    def test_verify_manifest_flags_missing_journey_screens(self):
        manifest = build_manifest("c", design_file=self.design, root=self.root)
        errors = verify_manifest(manifest, {
            "project_ref": manifest["project_ref"],
            "revision_ref": manifest["revision_ref"],
            "components": ["ProductCard"],
            "journey_screens": [],
        })
        self.assertTrue(any("Missing journey screens" in e for e in errors))

    def test_resolve_design_ref_prefers_openpencil_then_legacy(self):
        self.assertEqual(resolve_design_ref({"openpencil_ref": "a", "penpot_ref": "b"}), "a")
        self.assertEqual(resolve_design_ref({"penpot_ref": "b"}), "b")
        self.assertIsNone(resolve_design_ref({}))

    def test_legacy_shims_still_import(self):
        from tooling.experience import penpot_bridge, penpot_automation
        self.assertIs(penpot_bridge.build_manifest, build_manifest)
        self.assertIs(penpot_automation.build_operations, build_operations)

    def test_build_operations_reads_openpencil_block(self):
        path = self.root / "client-projects" / "c" / "experience" / "design" / "ui-implementation-registry.yaml"
        path.write_text(yaml.safe_dump({
            "registry_id": "r", "version": 1, "status": "approved", "specialists": {},
            "components": [{
                "semantic_id": "commerce.product-card",
                "openpencil": {"component": "ProductCard", "variants": ["mobile"]},
                "flutter": {"owned_component": "ProductCard", "primitive": "x"},
                "web": {"owned_component": "ProductCard", "primitive": "y"},
                "qa": {},
            }],
        }), encoding="utf-8")
        master = self.root / "client-projects" / "c" / "experience" / "design" / "master-design-system.yaml"
        master.write_text(yaml.safe_dump({"tokens": {"color": {"x": "y"}}, "breakpoints": {"desktop": 1024}}), encoding="utf-8")
        out = build_operations("c", self.root)
        self.assertEqual(out["components"][0]["component"], "ProductCard")
        self.assertEqual(out["breakpoints"]["desktop"], 1024)


if __name__ == "__main__":
    unittest.main()
