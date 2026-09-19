from pathlib import Path
import tempfile
import unittest

from tooling.performance.budgets import validate_measurements
from tooling.security.sbom import build_sbom


class SecurityPerformanceTests(unittest.TestCase):
    def test_sbom_contains_dependency_manifests(self):
        sbom = build_sbom()
        paths = {item["path"] for item in sbom["components"]}
        self.assertIn("package.json", paths)
        self.assertIn("requirements-production.txt", paths)

    def test_sbom_uses_supplied_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "requirements-dev.txt").write_text("PyYAML==6.0.2\n", encoding="utf-8")
            (root / "package.json").write_text("{}\n", encoding="utf-8")

            sbom = build_sbom(root)
            paths = {item["path"] for item in sbom["components"]}
            self.assertEqual(paths, {"requirements-dev.txt", "package.json"})
            for component in sbom["components"]:
                self.assertEqual(len(component["sha256"]), 64)

    def test_sbom_output_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text('{"name":"demo"}\n', encoding="utf-8")
            self.assertEqual(build_sbom(root), build_sbom(root))

    def test_performance_budget_detects_regression(self):
        budgets = {
            "budgets": {
                "storefront": {
                    "max_js_kb": 100,
                    "max_build_seconds": 20,
                }
            }
        }
        errors = validate_measurements(
            budgets,
            {"storefront": {"max_js_kb": 150, "max_build_seconds": 10}},
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("max_js_kb", errors[0])

    def test_performance_budget_within_limit_passes(self):
        budgets = {"budgets": {"storefront": {"max_js_kb": 100}}}
        errors = validate_measurements(budgets, {"storefront": {"max_js_kb": 100}})
        self.assertEqual(errors, [])

    def test_missing_app_measurements_are_an_error(self):
        budgets = {"budgets": {"storefront": {"max_js_kb": 100}}}
        errors = validate_measurements(budgets, {})
        self.assertEqual(len(errors), 1)
        self.assertIn("storefront: missing measurements", errors[0])

    def test_missing_metric_is_an_error(self):
        budgets = {"budgets": {"storefront": {"max_js_kb": 100, "max_build_seconds": 20}}}
        errors = validate_measurements(
            budgets, {"storefront": {"max_js_kb": 50}}
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("storefront.max_build_seconds: missing measurement", errors[0])


if __name__ == "__main__":
    unittest.main()
