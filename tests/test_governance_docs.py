from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class GovernanceDocsTests(unittest.TestCase):
    def test_governance_status_doc_lists_contracts(self):
        text = (ROOT / "docs" / "governance-status.md").read_text(encoding="utf-8")
        for term in (
            "Solution Contract",
            "Design Contract",
            "Integration Contract",
            "Data Contract",
            "Business Contract",
            "Change Contract",
            "Review Session",
            "Review Artifact",
            "AI promotion",
        ):
            with self.subTest(term=term):
                self.assertIn(term, text)

    def test_legacy_review_artifact_is_marked(self):
        text = (ROOT / "review" / "artifact-contract.md").read_text(encoding="utf-8")
        self.assertIn("Legacy", text)

    def test_review_readme_points_to_review_session(self):
        text = (ROOT / "review" / "README.md").read_text(encoding="utf-8")
        self.assertIn("review-session.schema.json", text)

    def test_ai_promotion_is_documented_as_a_guarded_gate(self):
        text = (ROOT / "docs" / "governance-status.md").read_text(encoding="utf-8").lower()
        self.assertIn("guarded gate", text)
        self.assertIn("never writes to governed truth", text)


if __name__ == "__main__":
    unittest.main()
