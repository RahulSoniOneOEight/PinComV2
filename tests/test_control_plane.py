from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.control_plane.index import build_index


class ControlPlaneTests(unittest.TestCase):
    def test_aggregates_multiple_clients(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for client, stage, blocked in [
                ("a", "productionize", False),
                ("b", "uat", True),
            ]:
                project = root / "client-projects" / client
                (project / "workflow").mkdir(parents=True)
                (project / "workflow/workflow-state.yaml").write_text(
                    yaml.safe_dump({
                        "client_id": client,
                        "current_stage": stage,
                        "blocked": blocked,
                    }),
                    encoding="utf-8",
                )

            result = build_index(root)
            self.assertEqual(result["totals"]["clients"], 2)
            self.assertEqual(result["totals"]["blocked"], 1)
            stages = {c["client_id"]: c["workflow_stage"] for c in result["clients"]}
            self.assertEqual(stages["a"], "productionize")
            self.assertEqual(stages["b"], "uat")

    def test_reference_client_surfaces_operational_attention(self):
        result = build_index()
        reference = next(c for c in result["clients"] if c["client_id"] == "reference-retail")
        self.assertTrue(reference["operational_attention"])
        self.assertEqual(reference["production_authorization"], "approved")


if __name__ == "__main__":
    unittest.main()
