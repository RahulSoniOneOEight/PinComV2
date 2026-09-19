from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class RuntimeStructureTests(unittest.TestCase):
    def test_flutter_runtime_exists(self):
        required = [
            ROOT / "apps/prototype_app/pubspec.yaml",
            ROOT / "apps/prototype_app/lib/main.dart",
            ROOT / "packages/agency_flutter_ui/pubspec.yaml",
            ROOT / "packages/agency_flutter_ui/lib/agency_flutter_ui.dart",
            ROOT / "apps/widgetbook/pubspec.yaml",
            ROOT / "apps/widgetbook/lib/main.dart",
        ]
        for path in required:
            self.assertTrue(path.exists(), path)

    def test_web_runtime_exists(self):
        required = [
            ROOT / "package.json",
            ROOT / "apps/storefront/package.json",
            ROOT / "apps/storefront/app/page.tsx",
            ROOT / "packages/agency_web_ui/package.json",
            ROOT / "packages/agency_web_ui/src/index.tsx",
            ROOT / "apps/storybook/package.json",
            ROOT / "apps/storybook/stories/ProductCard.stories.tsx",
        ]
        for path in required:
            self.assertTrue(path.exists(), path)

    def test_fixture_states_match_across_runtimes(self):
        flutter = (ROOT / "packages/agency_flutter_ui/lib/agency_flutter_ui.dart").read_text()
        web = (ROOT / "packages/agency_web_ui/src/index.tsx").read_text()
        states = ["loading", "empty", "failure", "paymentFailed"]
        for state in states:
            if state == "paymentFailed":
                self.assertIn("paymentFailed", flutter)
                self.assertIn("payment-failed", web)
            else:
                self.assertIn(state, flutter)
                self.assertIn(f'"{state}"', web)


if __name__ == "__main__":
    unittest.main()
