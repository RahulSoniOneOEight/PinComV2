from pathlib import Path
import tempfile
import unittest

import yaml

from tooling.validation.lifecycle import load_lifecycle, validate_lifecycle
from tooling.workflow.runtime import lifecycle as runtime_lifecycle


class LifecycleConsistencyTests(unittest.TestCase):
    def test_lifecycle_is_valid_for_reference_client(self):
        self.assertEqual(validate_lifecycle(), [])

    def test_runtime_and_validation_agree_on_stage_count(self):
        self.assertEqual(
            len(runtime_lifecycle()),
            len(load_lifecycle()),
        )

    def test_outputs_map_to_existing_reference_paths(self):
        root = Path(__file__).resolve().parents[1]
        project = root / "client-projects" / "reference-retail"
        for stage in load_lifecycle():
            with self.subTest(stage=stage["id"]):
                self.assertTrue((project / stage["output"]).exists())

    def test_unsafe_output_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "workflows").mkdir()
            (root / "client-projects" / "reference-retail").mkdir(parents=True)
            (root / "workflows" / "lifecycle.yaml").write_text(
                yaml.safe_dump(
                    {
                        "version": 1,
                        "stages": [
                            {"id": "escape", "output": "../../etc/passwd"},
                        ],
                    }
                ),
                encoding="utf-8",
            )
            errors = validate_lifecycle(root)
            self.assertTrue(any("unsafe lifecycle output" in e for e in errors))

    def test_missing_output_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "workflows").mkdir()
            (root / "client-projects" / "reference-retail").mkdir(parents=True)
            (root / "workflows" / "lifecycle.yaml").write_text(
                yaml.safe_dump(
                    {
                        "version": 1,
                        "stages": [{"id": "intake", "output": "input/client-input.yaml"}],
                    }
                ),
                encoding="utf-8",
            )
            errors = validate_lifecycle(root)
            self.assertTrue(any("lifecycle output missing" in e for e in errors))

    def test_duplicate_stage_ids_are_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "workflows").mkdir()
            project = root / "client-projects" / "reference-retail"
            (project / "input").mkdir(parents=True)
            (project / "input" / "client-input.yaml").write_text("client_id: x\n", encoding="utf-8")
            (root / "workflows" / "lifecycle.yaml").write_text(
                yaml.safe_dump(
                    {
                        "version": 1,
                        "stages": [
                            {"id": "intake", "output": "input/client-input.yaml"},
                            {"id": "intake", "output": "input/client-input.yaml"},
                        ],
                    }
                ),
                encoding="utf-8",
            )
            errors = validate_lifecycle(root)
            self.assertTrue(any("duplicate stage id" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
