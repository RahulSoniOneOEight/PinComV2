from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.ai.proposals import review
from tooling.contracts.validator import ROOT, validate


class AIProposalTests(unittest.TestCase):
    def test_reference_ai_proposal_is_valid(self):
        path = ROOT / "client-projects/reference-retail/intelligence/ai/interpretation.yaml"
        self.assertEqual(validate(path, "ai-proposal"), [])

    def test_human_review_updates_status_and_audit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "client-projects/demo/intelligence/ai/proposal.yaml"
            path.parent.mkdir(parents=True)
            path.write_text(
                "proposal_id: AI-DEMO-001\n"
                "client_id: demo\n"
                "task: test\n"
                "model_role: strategy\n"
                "provider: chatgpt\n"
                "inputs: [input/client-input.yaml]\n"
                "proposal: {}\n"
                "confidence: medium\n"
                "registry_validation: {status: pending}\n"
                "human_review: {status: pending}\n"
                "status: proposed\n",
                encoding="utf-8",
            )
            updated = review(
                "demo",
                "proposal.yaml",
                reviewer="qa-user",
                decision="approved",
                notes=["reviewed"],
                root=root,
            )
            self.assertEqual(updated["status"], "approved")
            self.assertEqual(updated["human_review"]["reviewer"], "qa-user")
            audit = root / "client-projects/demo/intelligence/ai/model-runs.jsonl"
            self.assertTrue(audit.exists())


if __name__ == "__main__":
    unittest.main()
