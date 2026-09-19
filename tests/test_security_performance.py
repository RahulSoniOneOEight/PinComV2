from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.performance.budgets import validate_measurements
from tooling.security.sbom import build_sbom


class SecurityPerformanceTests(unittest.TestCase):
    def test_sbom_contains_dependency_manifests(self):
        sbom = build_sbom()
        paths = {item["path"] for item in sbom["components"]}
        self.assertIn("package.json", paths)
        self.assertIn("requirements-production.txt", paths)

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


if __name__ == "__main__":
    unittest.main()
