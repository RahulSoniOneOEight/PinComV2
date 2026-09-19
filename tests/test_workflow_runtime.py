from pathlib import Path
import shutil
import tempfile
import unittest

from tooling.workflow.runtime import (
    WorkflowError,
    advance,
    validate_state,
)


class WorkflowRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        shutil.copytree(Path("workflows"), self.root / "workflows")

        project = self.root / "client-projects" / "demo"
        (project / "workflow").mkdir(parents=True)
        (project / "input").mkdir(parents=True)
        (project / "derived").mkdir(parents=True)

        (project / "input" / "client-input.yaml").write_text("client_id: demo\n")
        (project / "derived" / "client-profile.yaml").write_text("client_id: demo\n")

        (project / "workflow" / "workflow-state.yaml").write_text(
            "client_id: demo\n"
            "workflow_version: 1\n"
            "current_stage: normalize-client-truth\n"
            "completed:\n"
            "  - client-intake\n"
            "blocked: false\n"
            "human_approvals: []\n"
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_state_valid_when_prior_output_exists(self):
        self.assertEqual(validate_state("demo", self.root), [])

    def test_advance_requires_current_output(self):
        state = advance("demo", actor="test", root=self.root)
        self.assertEqual(state["current_stage"], "classify-industry-archetype")
        audit = (
            self.root
            / "client-projects"
            / "demo"
            / "workflow"
            / "audit.jsonl"
        )
        self.assertTrue(audit.exists())

    def test_blocked_project_cannot_advance(self):
        state_path = (
            self.root
            / "client-projects"
            / "demo"
            / "workflow"
            / "workflow-state.yaml"
        )
        state_path.write_text(
            state_path.read_text().replace("blocked: false", "blocked: true")
        )
        with self.assertRaises(WorkflowError):
            advance("demo", actor="test", root=self.root)


if __name__ == "__main__":
    unittest.main()
