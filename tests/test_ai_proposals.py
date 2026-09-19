from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.ai.proposals import ProposalError, promote, review
from tooling.contracts.validator import ROOT, validate, validate_document


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


class AIProposalPromotionTests(unittest.TestCase):
    def _proposal(self, root: Path, review_status="approved", reviewer="qa-user") -> Path:
        path = root / "client-projects/demo/intelligence/ai/proposal.yaml"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            yaml.safe_dump(
                {
                    "proposal_id": "AI-DEMO-001",
                    "client_id": "demo",
                    "task": "test",
                    "model_role": "strategy",
                    "provider": "chatgpt",
                    "inputs": ["input/client-input.yaml"],
                    "proposal": {},
                    "confidence": "medium",
                    "registry_validation": {"status": "passed"},
                    "human_review": {
                        "status": review_status,
                        "reviewer": reviewer,
                        "notes": [],
                    },
                    "status": "approved",
                }
            ),
            encoding="utf-8",
        )
        return path

    def test_promote_writes_decision_and_audit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._proposal(root)
            decision = promote(
                "demo",
                "proposal.yaml",
                target="client-input",
                promoted_by="release-owner",
                root=root,
            )
            self.assertEqual(decision["proposal_id"], "AI-DEMO-001")
            self.assertEqual(decision["reviewer"], "qa-user")

            decision_path = (
                root / "client-projects/demo/intelligence/ai/decisions/AI-DEMO-001.yaml"
            )
            self.assertTrue(decision_path.exists())
            stored = yaml.safe_load(decision_path.read_text(encoding="utf-8"))
            self.assertEqual(stored["target"], "client-input")
            self.assertEqual(stored["decision"], "approved")

            proposal = yaml.safe_load(
                (root / "client-projects/demo/intelligence/ai/proposal.yaml").read_text(
                    encoding="utf-8"
                )
            )
            self.assertEqual(proposal["status"], "promoted")

            audit = root / "client-projects/demo/intelligence/ai/model-runs.jsonl"
            self.assertTrue(audit.exists())
            self.assertIn("ai.proposal.promoted", audit.read_text(encoding="utf-8"))

    def test_promote_requires_human_approval(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._proposal(root, review_status="pending", reviewer=None)
            with self.assertRaises(ProposalError):
                promote(
                    "demo",
                    "proposal.yaml",
                    target="client-input",
                    promoted_by="release-owner",
                    root=root,
                )

    def test_promote_requires_explicit_promoter(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._proposal(root)
            with self.assertRaises(ProposalError):
                promote(
                    "demo",
                    "proposal.yaml",
                    target="client-input",
                    promoted_by=None,
                    root=root,
                )

    def test_promote_rejects_unsafe_target(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._proposal(root)
            with self.assertRaises(ProposalError):
                promote(
                    "demo",
                    "proposal.yaml",
                    target="../derived",
                    promoted_by="release-owner",
                    root=root,
                )

    def test_ai_decision_schema_accepts_valid_record(self):
        record = {
            "decision_id": "DEC-AI-DEMO-001",
            "proposal_id": "AI-DEMO-001",
            "client_id": "demo",
            "reviewer": "qa-user",
            "decision": "approved",
            "target": "client-input",
            "decided_at": "2026-09-20T00:00:00Z",
            "notes": [],
        }
        self.assertEqual(validate_document(record, "ai-decision"), [])


if __name__ == "__main__":
    unittest.main()
