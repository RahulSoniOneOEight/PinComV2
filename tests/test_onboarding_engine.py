from pathlib import Path
import shutil
import tempfile
import unittest

from tooling.onboarding.engine import build_blueprint


class OnboardingEngineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

        for folder in ("intelligence", "platform"):
            shutil.copytree(Path(folder), self.root / folder)

        project = self.root / "client-projects" / "demo" / "input"
        project.mkdir(parents=True)
        (project / "client-input.yaml").write_text(
            "client_id: demo\n"
            "industry: retail\n"
            "business_models: [d2c, b2b]\n"
            "requested_capabilities:\n"
            "  - catalogue\n"
            "  - cart\n"
            "  - checkout\n"
            "  - orders\n"
            "  - fulfilment\n"
            "required_integrations: [payment, logistics, whatsapp]\n"
            "risk_profile: standard\n",
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_generates_expected_blueprint(self):
        blueprint = build_blueprint("demo", self.root)
        files = blueprint.files

        self.assertIn("derived/client-profile.yaml", files)
        self.assertIn("derived/benchmark-report.yaml", files)
        self.assertIn("derived/capability-gap.yaml", files)
        self.assertIn("derived/capability-map.yaml", files)
        self.assertIn("derived/journey-map.yaml", files)
        self.assertIn("derived/entity-map.yaml", files)
        self.assertIn("derived/surface-map.yaml", files)
        self.assertIn("derived/dependency-map.yaml", files)
        self.assertIn("solution/solution-contract.yaml", files)

        profile = files["derived/client-profile.yaml"]
        self.assertEqual(profile["archetypes"], ["d2c-commerce", "b2b-commerce"])

        benchmark = files["derived/benchmark-report.yaml"]
        self.assertIn("return-refund", benchmark["expected"]["core_capabilities"])
        self.assertIn("quote-to-order", benchmark["expected"]["journeys"])

        gap = files["derived/capability-gap.yaml"]
        self.assertIn("search", gap["core_missing"])

        solution = files["solution/solution-contract.yaml"]
        providers = solution["providers"]
        self.assertEqual(providers["commerce"]["provider"], "medusa")
        self.assertEqual(providers["erp"]["provider"], "tryton")
        self.assertEqual(providers["search"]["provider"], "meilisearch")
        self.assertEqual(providers["automation"]["provider"], "activepieces")

    def test_entity_and_dependency_maps_are_derived(self):
        blueprint = build_blueprint("demo", self.root)
        entities = blueprint.files["derived/entity-map.yaml"]["entities"]
        flows = blueprint.files["derived/dependency-map.yaml"]["critical_cross_domain_flows"]

        self.assertIn("order", entities)
        self.assertIn("inventory", entities)
        self.assertIn("payment", entities)
        self.assertTrue(any(flow["id"] == "return-to-refund" for flow in flows))


if __name__ == "__main__":
    unittest.main()
