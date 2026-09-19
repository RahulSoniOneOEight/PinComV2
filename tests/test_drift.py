from pathlib import Path
import shutil
import tempfile
import unittest

from tooling.validation.drift import blueprint_drift, check, experience_drift

ROOT = Path(__file__).resolve().parents[1]


class GeneratedArtifactDriftTests(unittest.TestCase):
    def test_reference_artifacts_match_generators(self):
        self.assertEqual(blueprint_drift("reference-retail"), [])
        self.assertEqual(experience_drift("reference-retail"), [])
        self.assertEqual(check("reference-retail"), [])

    def test_drift_is_detected_in_a_mutated_copy(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(ROOT / "intelligence", root / "intelligence")
            shutil.copytree(ROOT / "platform", root / "platform")
            shutil.copytree(
                ROOT / "client-projects" / "reference-retail",
                root / "client-projects" / "reference-retail",
            )

            self.assertEqual(check("reference-retail", root), [])

            target = (
                root
                / "client-projects"
                / "reference-retail"
                / "derived"
                / "client-profile.yaml"
            )
            target.write_text("client_id: reference-retail\nstatus: hand-edited\n", encoding="utf-8")
            self.assertIn("drift: derived/client-profile.yaml", blueprint_drift("reference-retail", root))

    def test_experience_drift_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(ROOT / "intelligence", root / "intelligence")
            shutil.copytree(ROOT / "platform", root / "platform")
            shutil.copytree(
                ROOT / "client-projects" / "reference-retail",
                root / "client-projects" / "reference-retail",
            )
            target = (
                root
                / "client-projects"
                / "reference-retail"
                / "experience"
                / "directions"
                / "a.yaml"
            )
            target.write_text("direction_id: DIR-TAMPERED\n", encoding="utf-8")
            self.assertIn("drift: experience/directions/a.yaml", experience_drift("reference-retail", root))


if __name__ == "__main__":
    unittest.main()
