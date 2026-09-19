from pathlib import Path
import unittest

from tooling.contracts.validator import ROOT, validate


class ContractValidationTests(unittest.TestCase):
    def test_reference_solution_contract_is_valid(self):
        path = ROOT / "client-projects/reference-retail/solution/solution-contract.yaml"
        self.assertEqual(validate(path, "solution"), [])

    def test_reference_workflow_state_is_valid_schema(self):
        path = ROOT / "client-projects/reference-retail/workflow/workflow-state.yaml"
        self.assertEqual(validate(path, "workflow-state"), [])

    def test_change_template_is_valid_schema(self):
        path = ROOT / "templates/change-contract.yaml"
        self.assertEqual(validate(path, "change"), [])

    def test_review_template_is_valid_schema(self):
        path = ROOT / "templates/review-artifact.yaml"
        self.assertEqual(validate(path, "review-artifact"), [])


if __name__ == "__main__":
    unittest.main()
