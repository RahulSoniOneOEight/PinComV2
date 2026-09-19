from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from tooling.integration.runtime import DeliveryResult, DomainCommand


@dataclass
class ProviderConfig:
    provider: str
    base_url: str
    token: str | None = None
    timeout_seconds: int = 30


Transport = Callable[[ProviderConfig, DomainCommand], dict[str, Any]]


class ConfiguredAdapter:
    def __init__(self, config: ProviderConfig, transport: Transport):
        self.config = config
        self.provider = config.provider
        self.transport = transport

    def execute(self, command: DomainCommand) -> DeliveryResult:
        try:
            response = self.transport(self.config, command)
            return DeliveryResult(
                success=bool(response.get("success", True)),
                provider=self.provider,
                command_id=command.command_id,
                attempt=1,
                external_id=response.get("external_id"),
                error=response.get("error"),
            )
        except Exception as exc:
            return DeliveryResult(
                success=False,
                provider=self.provider,
                command_id=command.command_id,
                attempt=1,
                error=str(exc),
            )


def medusa_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "medusa":
        raise ValueError("Expected medusa provider config")
    return ConfiguredAdapter(config, transport)


def tryton_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "tryton":
        raise ValueError("Expected tryton provider config")
    return ConfiguredAdapter(config, transport)


def meilisearch_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "meilisearch":
        raise ValueError("Expected meilisearch provider config")
    return ConfiguredAdapter(config, transport)


def chatwoot_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "chatwoot":
        raise ValueError("Expected chatwoot provider config")
    return ConfiguredAdapter(config, transport)


def activepieces_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "activepieces":
        raise ValueError("Expected activepieces provider config")
    return ConfiguredAdapter(config, transport)


def mercur_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    if config.provider != "mercur":
        raise ValueError("Expected mercur provider config")
    return ConfiguredAdapter(config, transport)
