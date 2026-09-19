from pathlib import Path
import tempfile
import unittest

from tooling.ai.proposals import ProposalError, proposal_path
from tooling.onboarding.engine import OnboardingError, build_blueprint
from tooling.onboarding.init_client import ClientInitError, initialize_client
from tooling.release.candidate import CandidateError, create_candidate
from tooling.review.session import ReviewError, create_build_identity
from tooling.validation.identifiers import (
    IdentifierError,
    is_safe_identifier,
    validate_identifier,
)
from tooling.workflow.runtime import WorkflowError, project_root


class IdentifierValidationTests(unittest.TestCase):
    def test_reasonable_ids_are_accepted(self):
        for value in ("reference-retail", "client_101", "abc.1", "RC-demo-1"):
            with self.subTest(value=value):
                self.assertEqual(validate_identifier(value), value)

    def test_path_traversal_is_rejected(self):
        for value in ("../x", "../../", "..", ".", "a/b", "a\\b", "/etc/passwd"):
            with self.subTest(value=value):
                self.assertFalse(is_safe_identifier(value))
                with self.assertRaises(IdentifierError):
                    validate_identifier(value)

    def test_unsafe_characters_are_rejected(self):
        for value in ("", "a b", "a;b", "a:b", "a|b", "a\nb", "-leading"):
            with self.subTest(value=value):
                self.assertFalse(is_safe_identifier(value))

    def test_double_dot_inside_is_rejected(self):
        self.assertFalse(is_safe_identifier("a..b"))


class IdentifierEnforcementTests(unittest.TestCase):
    def test_init_client_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ClientInitError):
                initialize_client(
                    client_id="../evil",
                    industry="retail",
                    business_models=["d2c"],
                    root=Path(tmp),
                )

    def test_candidate_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(CandidateError):
                create_candidate(
                    client_id="../evil",
                    source_revision="abc",
                    artifact_paths=[],
                    created_by="tester",
                    root=Path(tmp),
                )

    def test_candidate_rejects_unsafe_source_revision(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(CandidateError):
                create_candidate(
                    client_id="demo",
                    source_revision="../evil",
                    artifact_paths=[],
                    created_by="tester",
                    root=Path(tmp),
                )

    def test_proposal_path_rejects_traversal(self):
        with self.assertRaises(ProposalError):
            proposal_path("../evil", "interpretation.yaml")
        with self.assertRaises(ProposalError):
            proposal_path("demo", "../escape.yaml")

    def test_engine_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(OnboardingError):
                build_blueprint("../evil", Path(tmp))

    def test_review_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ReviewError):
                create_build_identity(
                    "../evil", "a.yaml", "ref001", "tester", root=Path(tmp)
                )

    def test_workflow_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(WorkflowError):
                project_root("../evil", Path(tmp))


if __name__ == "__main__":
    unittest.main()
