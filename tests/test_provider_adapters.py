import unittest

from tooling.integration.adapters import (
    ProviderConfig,
    activepieces_adapter,
    chatwoot_adapter,
    medusa_adapter,
    meilisearch_adapter,
    mercur_adapter,
    tryton_adapter,
)
from tooling.integration.runtime import DomainCommand


def ok_transport(config, command):
    return {"success": True, "external_id": f"{config.provider}-1"}


class ProviderAdapterTests(unittest.TestCase):
    def test_all_provider_factories_execute_contract(self):
        factories = [
            ("medusa", medusa_adapter),
            ("mercur", mercur_adapter),
            ("tryton", tryton_adapter),
            ("meilisearch", meilisearch_adapter),
            ("chatwoot", chatwoot_adapter),
            ("activepieces", activepieces_adapter),
        ]
        command = DomainCommand(
            command_id="cmd-1",
            command_type="test.execute",
            target="test",
            payload={},
            idempotency_key="test:1",
        )
        for provider, factory in factories:
            adapter = factory(
                ProviderConfig(provider=provider, base_url="http://example.invalid"),
                ok_transport,
            )
            result = adapter.execute(command)
            self.assertTrue(result.success)
            self.assertEqual(result.provider, provider)
            self.assertEqual(result.external_id, f"{provider}-1")


if __name__ == "__main__":
    unittest.main()
