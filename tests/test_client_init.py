from pathlib import Path
import tempfile
import unittest

from tooling.onboarding.init_client import ClientInitError, initialize_client


class ClientInitTests(unittest.TestCase):
    def test_initializes_governed_workspace(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            project = initialize_client(
                client_id="acme",
                industry="retail",
                business_models=["d2c", "b2b"],
                requested_capabilities=["catalogue", "checkout"],
                required_integrations=["payment"],
                root=root,
            )

            self.assertTrue((project / "input" / "client-input.yaml").exists())
            self.assertTrue((project / "workflow" / "workflow-state.yaml").exists())
            self.assertTrue((project / "derived").exists())
            self.assertTrue((project / "solution").exists())
            self.assertTrue((project / "changes").exists())
            self.assertTrue((project / "release").exists())

            state = (project / "workflow" / "workflow-state.yaml").read_text()
            self.assertIn("current_stage: client-intake", state)

    def test_refuses_existing_client(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            initialize_client(
                client_id="acme",
                industry="retail",
                business_models=["d2c"],
                root=root,
            )
            with self.assertRaises(ClientInitError):
                initialize_client(
                    client_id="acme",
                    industry="retail",
                    business_models=["d2c"],
                    root=root,
                )


if __name__ == "__main__":
    unittest.main()
