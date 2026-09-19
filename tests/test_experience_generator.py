from pathlib import Path
import shutil
import tempfile
import unittest

from tooling.experience.generator import build_experience


class ExperienceGeneratorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        project = self.root / "client-projects" / "demo" / "derived"
        project.mkdir(parents=True)
        (project / "surface-map.yaml").write_text(
            "client_id: demo\n"
            "required: [customer-app, web-store, commerce-admin]\n"
            "recommended: [ops-console]\n",
            encoding="utf-8",
        )
        (project / "journey-map.yaml").write_text(
            "client_id: demo\n"
            "journeys:\n"
            "  - {id: browse-to-buy, status: required}\n"
            "  - {id: return-refund, status: required}\n",
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_generates_three_distinct_directions(self):
        files = build_experience("demo", self.root)
        a = files["experience/directions/a.yaml"]
        b = files["experience/directions/b.yaml"]
        c = files["experience/directions/c.yaml"]
        self.assertEqual(a["strategy"], "discovery-first")
        self.assertEqual(b["strategy"], "search-first")
        self.assertEqual(c["strategy"], "task-first")
        self.assertNotEqual(a["design_intent"], b["design_intent"])

    def test_generates_surface_runtime_manifest(self):
        files = build_experience("demo", self.root)
        manifest = files["experience/prototypes/a-manifest.yaml"]
        runtimes = {item["id"]: item["runtime"] for item in manifest["surfaces"]}
        self.assertEqual(runtimes["customer-app"], "flutter")
        self.assertEqual(runtimes["web-store"], "web")
        self.assertEqual(runtimes["commerce-admin"], "web")

    def test_fixture_set_contains_failure_states(self):
        files = build_experience("demo", self.root)
        fixture = files["experience/fixtures/commerce-baseline.yaml"]
        ids = [state["id"] for state in fixture["states"]]
        self.assertIn("failure", ids)
        self.assertIn("payment-failed", ids)


if __name__ == "__main__":
    unittest.main()
