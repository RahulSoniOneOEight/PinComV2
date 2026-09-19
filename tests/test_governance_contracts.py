from pathlib import Path
import unittest

from tooling.contracts.validator import ROOT, validate, validate_document


class GovernanceContractTests(unittest.TestCase):
    def test_reference_data_contract_is_valid(self):
        path = ROOT / "client-projects/reference-retail/contracts/data-contract.yaml"
        self.assertEqual(validate(path, "data-contract"), [])

    def test_reference_business_contract_is_valid(self):
        path = ROOT / "client-projects/reference-retail/contracts/business-contract.yaml"
        self.assertEqual(validate(path, "business-contract"), [])

    def test_reference_change_contract_is_valid(self):
        path = ROOT / "client-projects/reference-retail/changes/CHG-001.yaml"
        self.assertEqual(validate(path, "change"), [])

    def test_data_contract_requires_canonical_owner(self):
        errors = validate_document(
            {
                "contract_id": "DC-1",
                "client_id": "demo",
                "entities": [{"name": "order", "consumers": []}],
                "status": "draft",
            },
            "data-contract",
        )
        self.assertTrue(errors)

    def test_business_contract_rejects_unknown_category(self):
        errors = validate_document(
            {
                "contract_id": "BC-1",
                "client_id": "demo",
                "rules": [{"id": "BR-1", "statement": "x", "category": "nonsense"}],
                "status": "draft",
            },
            "business-contract",
        )
        self.assertTrue(errors)

    def test_change_contract_rejects_bad_change_id(self):
        errors = validate_document(
            {
                "change_id": "CHG-REF-001",
                "request": "x",
                "type": "data",
                "affected_capabilities": [],
                "affected_domains": [],
                "affected_surfaces": [],
                "affected_entities": [],
                "affected_events": [],
                "required_tests": [],
                "approval_required": False,
                "status": "proposed",
            },
            "change",
        )
        self.assertTrue(errors)


if __name__ == "__main__":
    unittest.main()
