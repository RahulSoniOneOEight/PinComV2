import tempfile, unittest, yaml
from pathlib import Path
from tooling.validation.governance import check_governance

class GovernanceTests(unittest.TestCase):
    def _client(self, d):
        p = Path(d) / "client-projects" / "demo"
        (p / "experience" / "references").mkdir(parents=True)
        (p / "experience" / "qa").mkdir(parents=True)
        (p / "approved").mkdir(parents=True)
        return p

    def test_requires_reviewer_identity(self):
        with tempfile.TemporaryDirectory() as d:
            p = self._client(d)
            (p / "experience" / "references" / "adaptation.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "sources": [], "status": "evaluated"}))
            (p / "experience" / "qa" / "design-critic.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "critic": "design", "status": "passed"}))
            (p / "experience" / "qa" / "journey-critic.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "critic": "journey", "status": "passed", "reviewer": "r"}))
            (p / "approved" / "experience-approval.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "decision": "approved", "approved_by": "owner", "immutable": True}))
            result = check_governance("demo", Path(d))
            self.assertEqual(result["status"], "blocked")
            self.assertIn("adaptation.yaml", result["blockers"][0])
            self.assertIn("design-critic.yaml", result["blockers"][1])

    def test_passes_when_all_reviewed(self):
        with tempfile.TemporaryDirectory() as d:
            p = self._client(d)
            (p / "experience" / "references" / "adaptation.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "sources": [], "status": "evaluated", "reviewed_by": "RS (Project Lead)"}))
            (p / "experience" / "qa" / "design-critic.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "critic": "design", "status": "passed", "reviewer": "r"}))
            (p / "experience" / "qa" / "journey-critic.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "critic": "journey", "status": "passed", "reviewer": "r"}))
            (p / "approved" / "experience-approval.yaml").write_text(yaml.safe_dump(
                {"client_id": "demo", "decision": "approved", "approved_by": "owner", "immutable": True}))
            result = check_governance("demo", Path(d))
            self.assertEqual(result["status"], "passed")

if __name__ == "__main__":
    unittest.main()
