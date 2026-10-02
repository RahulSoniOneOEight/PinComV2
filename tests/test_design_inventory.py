from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.experience.design_inventory import evaluate, evaluate_documents, DesignInventoryError

ROOT = Path(__file__).resolve().parents[1]


def _taxonomy():
    return {
        "version": 1,
        "elements": [
            {"id": "F1", "level": "F", "name": "Colour", "evaluation": "required"},
            {"id": "F2", "level": "F", "name": "Type scale", "evaluation": "required"},
            {"id": "P1", "level": "P", "name": "Icons", "evaluation": "required"},
            {"id": "X1", "level": "X", "name": "Watermarks", "evaluation": "required"},
            {"id": "P18", "level": "P", "name": "Slider", "evaluation": "optional"},
            {"id": "C9", "level": "C", "name": "Rating", "evaluation": "conditional"},
        ],
    }


class DesignInventoryTests(unittest.TestCase):
    def test_platform_taxonomy_is_complete_and_unique(self):
        doc = yaml.safe_load((ROOT / "design-contract" / "design-element-inventory.yaml").read_text(encoding="utf-8"))
        ids = [e["id"] for e in doc["elements"]]
        self.assertEqual(len(ids), len(set(ids)), "taxonomy element ids must be unique")
        levels = {l["id"] for l in doc["levels"]}
        self.assertTrue({e["level"] for e in doc["elements"]}.issubset(levels))
        self.assertTrue(all(e.get("evaluation") in {"required", "conditional", "optional"} for e in doc["elements"]))

    def test_client102_inventory_covers_the_whole_taxonomy(self):
        doc = yaml.safe_load(
            (ROOT / "client-projects" / "client102" / "experience" / "design" / "design-element-inventory.yaml")
            .read_text(encoding="utf-8"))
        taxonomy = yaml.safe_load((ROOT / "design-contract" / "design-element-inventory.yaml").read_text(encoding="utf-8"))
        self.assertEqual(
            {e["id"] for e in doc["elements"]},
            {e["id"] for e in taxonomy["elements"]},
            "client102 must evaluate every taxonomy element",
        )
        self.assertTrue(doc.get("plan"), "client102 must carry a plan")

    def test_required_and_done_is_gate_ready(self):
        client = {"client_id": "c", "elements": [
            {"id": "F1", "status": "done"}, {"id": "F2", "status": "done"},
            {"id": "P1", "status": "done"}, {"id": "X1", "status": "done"},
            {"id": "P18", "status": "missing"}, {"id": "C9", "status": "missing"},
        ]}
        result = evaluate_documents(_taxonomy(), client)
        self.assertTrue(result["gate_ready"])
        self.assertEqual(result["blockers"], [])

    def test_required_missing_blocks(self):
        client = {"client_id": "c", "elements": [
            {"id": "F1", "status": "done"}, {"id": "F2", "status": "partial"},
            {"id": "P1", "status": "done"}, {"id": "X1", "status": "missing"},
        ]}
        result = evaluate_documents(_taxonomy(), client)
        self.assertFalse(result["gate_ready"])
        self.assertTrue(any("X1" in b for b in result["blockers"]))
        self.assertTrue(any("F2" in w for w in result["warnings"]))

    def test_not_applicable_requires_reason(self):
        client = {"client_id": "c", "elements": [
            {"id": "F1", "status": "done"}, {"id": "F2", "status": "done"},
            {"id": "P1", "status": "done"}, {"id": "X1", "status": "done"},
            {"id": "C9", "status": "not-applicable"},
        ]}
        result = evaluate_documents(_taxonomy(), client)
        self.assertTrue(any("no reason" in w or "without a reason" in w for w in result["warnings"]))

    def test_unknown_and_duplicate_ids(self):
        with self.assertRaises(DesignInventoryError):
            evaluate_documents(_taxonomy(), {"client_id": "c", "elements": [
                {"id": "F1", "status": "done"}, {"id": "F1", "status": "missing"},
            ]})
        client = {"client_id": "c", "elements": [
            {"id": "F1", "status": "done"}, {"id": "F2", "status": "done"},
            {"id": "P1", "status": "done"}, {"id": "X1", "status": "done"}, {"id": "ZZ9", "status": "done"},
        ]}
        self.assertTrue(any("ZZ9" in w for w in evaluate_documents(_taxonomy(), client)["warnings"]))

    def test_evaluate_reads_from_root(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "design-contract").mkdir(parents=True)
            (root / "design-contract" / "design-element-inventory.yaml").write_text(
                yaml.safe_dump(_taxonomy()), encoding="utf-8")
            p = root / "client-projects" / "c" / "experience" / "design"
            p.mkdir(parents=True)
            (p / "design-element-inventory.yaml").write_text(yaml.safe_dump(
                {"client_id": "c", "elements": [
                    {"id": "F1", "status": "done"}, {"id": "F2", "status": "done"},
                    {"id": "P1", "status": "done"}, {"id": "X1", "status": "done"},
                ]}), encoding="utf-8")
            result = evaluate("c", root)
            self.assertTrue(result["gate_ready"])
            self.assertEqual(result["coverage_percent"], 66.7)


if __name__ == "__main__":
    unittest.main()
