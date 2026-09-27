import tempfile, unittest, yaml
from pathlib import Path
from tooling.intelligence.journey_engine import build, validate_executable, _actor

ALL_JOURNEYS = [
    "browse-to-buy", "search-to-buy", "order-tracking", "return-refund",
    "quote-to-order", "repeat-order", "credit-order", "seller-onboarding",
    "seller-catalogue", "marketplace-order", "seller-fulfilment", "seller-return",
    "seller-settlement",
]

class JourneyEngineTests(unittest.TestCase):
    def test_actor_mapping(self):
        self.assertEqual(_actor("seller-onboarding"), "seller")
        self.assertEqual(_actor("seller-settlement"), "seller")
        self.assertEqual(_actor("marketplace-order"), "operator")
        self.assertEqual(_actor("quote-to-order"), "b2b-buyer")
        self.assertEqual(_actor("browse-to-buy"), "customer")

    def test_all_journeys_executable(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            project = root / "client-projects" / "demo"
            (project / "derived").mkdir(parents=True)
            (project / "derived" / "journey-map.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "journeys": [{"id": j, "status": "required"} for j in ALL_JOURNEYS]}))
            (project / "derived" / "surface-map.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "required": ["customer-app", "web-store", "b2b", "seller-portal", "commerce-admin", "erp", "analytics", "ops-console"], "recommended": []}))
            graph = build("demo", root)
            self.assertEqual(len(graph["journeys"]), len(ALL_JOURNEYS))
            for journey in graph["journeys"]:
                self.assertGreaterEqual(len(journey["nodes"]), 2,
                    f"{journey['id']} has fewer than 2 nodes")
                self.assertTrue(journey.get("surfaces"), f"{journey['id']} has no surfaces")
            self.assertEqual(validate_executable(graph), [])

    def test_actor_surface_precedence(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            project = root / "client-projects" / "demo"
            (project / "derived").mkdir(parents=True)
            (project / "derived" / "journey-map.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "journeys": [
                    {"id": "seller-fulfilment", "status": "required"},
                    {"id": "quote-to-order", "status": "required"},
                ]}))
            (project / "derived" / "surface-map.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "required": ["customer-app", "web-store", "b2b", "seller-portal", "commerce-admin"], "recommended": []}))
            graph = build("demo", root)
            by_id = {j["id"]: j for j in graph["journeys"]}
            self.assertEqual(by_id["seller-fulfilment"]["surfaces"], ["seller-portal"])
            self.assertEqual(by_id["quote-to-order"]["surfaces"], ["b2b"])

if __name__ == "__main__":
    unittest.main()
