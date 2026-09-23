import io
import json
import unittest
from urllib.request import Request

from tooling.experience.dependency_collectors import collect_npm, collect_pub
from tooling.experience.feedback import normalize_feedback
from tooling.experience.learning_pipeline import rank_candidates
from tooling.experience.source_connectors import extract_reference_site, fetch_figma


class Response:
    def __init__(self, body):
        self.body = body
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self): return self.body


def opener_for(payload):
    raw = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
    return lambda request, timeout=30: Response(raw)


class ConnectorLearningOpsTests(unittest.TestCase):
    def test_figma_connector_normalizes_api_payload(self):
        result = fetch_figma("abc", token="x", opener=opener_for({"name": "Demo", "components": {"c1": {"name": "Card"}}}))
        self.assertEqual(result["type"], "figma")
        self.assertEqual(result["components"][0]["name"], "Card")
        self.assertTrue(result["provenance"]["content_hash"].startswith("sha256:"))

    def test_reference_site_extracts_styles_and_colors(self):
        html = b'<html><head><link rel="stylesheet" href="/a.css"><meta name="description" content="demo"></head><body style="color:#112233"></body></html>'
        result = extract_reference_site("https://example.test", opener=opener_for(html))
        self.assertEqual(result["type"], "reference-site")
        self.assertIn("#112233", result["colors"].values())

    def test_dependency_collectors_shape_current_metadata(self):
        npm = collect_npm("pkg", "web", opener=opener_for({"dist-tags":{"latest":"1.2.3"},"versions":{"1.2.3":{"license":"MIT","peerDependencies":{"react":">=19"}}},"time":{"1.2.3":"2026-09-01T00:00:00Z"}}))
        pub = collect_pub("pkg", "flutter", opener=opener_for({"latest":{"version":"2.0.0","published":"2026-09-01T00:00:00Z","archive_url":"x","pubspec":{"license":"MIT","environment":{"sdk":">=3.4"}}}}))
        self.assertEqual(npm["license"], "MIT")
        self.assertEqual(pub["version"], "2.0.0")

    def test_feedback_and_learning_are_advisory(self):
        feedback = normalize_feedback({"target":"a","decision":"accepted","reviewer":"human"})
        policy = {
            "minimum_observations": 1, "max_ranking_adjustment": 10,
            "accepted_weight": 2, "accepted_with_changes_weight": 1, "rejected_weight": -2,
            "telemetry": {"passed_weight": 2, "review_weight": 0, "failed_weight": -2},
            "guardrails": {"advisory_only": True, "requires_human_approval": True, "auto_promote": False, "mutate_approved_client_design": False},
        }
        ranked = rank_candidates([{"id":"a","base_score":80},{"id":"b","base_score":81}], [feedback], [], policy=policy)
        self.assertEqual(ranked["candidates"][0]["id"], "a")
        self.assertEqual(ranked["status"], "advisory-only")
        self.assertTrue(ranked["requires_human_approval"])


if __name__ == "__main__":
    unittest.main()
