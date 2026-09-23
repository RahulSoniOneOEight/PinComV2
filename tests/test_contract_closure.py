import unittest
from pathlib import Path
from tooling.contracts.validator import validate
from tooling.validation.preprototype import evaluate
class ContractClosureTests(unittest.TestCase):
    def test_design_and_integration_contracts_validate(self):
        self.assertEqual(validate(Path("client-projects/reference-retail/contracts/design-contract.yaml"),"design-contract"),[])
        self.assertEqual(validate(Path("client-projects/reference-retail/contracts/integration-contract.yaml"),"integration-contract"),[])
    def test_preprototype_gate(self):
        self.assertEqual(evaluate("reference-retail")["status"],"complete")
if __name__=="__main__": unittest.main()
