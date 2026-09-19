from pathlib import Path
import tempfile
import unittest

from tooling.ai.router import RoutingError, resolve_role


class AIRoutingTests(unittest.TestCase):
    def test_strategy_routes_to_chatgpt(self):
        config = resolve_role("strategy")
        self.assertEqual(config["preferred_provider"], "chatgpt")

    def test_implementation_routes_to_deepseek(self):
        config = resolve_role("implementation")
        self.assertEqual(config["preferred_provider"], "deepseek")

    def test_unknown_role_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "routing.yaml"
            path.write_text("version: 1\nroles:\n  strategy:\n    preferred_provider: chatgpt\n")
            with self.assertRaises(RoutingError):
                resolve_role("missing", path)


if __name__ == "__main__":
    unittest.main()
