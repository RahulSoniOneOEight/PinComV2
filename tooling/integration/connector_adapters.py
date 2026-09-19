from __future__ import annotations

from tooling.integration.adapters import ConfiguredAdapter, ProviderConfig, Transport


def connector_adapter(
    expected_provider: str,
    config: ProviderConfig,
    transport: Transport,
) -> ConfiguredAdapter:
    if config.provider != expected_provider:
        raise ValueError(f"Expected {expected_provider} provider config")
    return ConfiguredAdapter(config, transport)


def razorpay_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    return connector_adapter("razorpay", config, transport)


def cashfree_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    return connector_adapter("cashfree", config, transport)


def shiprocket_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    return connector_adapter("shiprocket", config, transport)


def delhivery_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    return connector_adapter("delhivery", config, transport)


def whatsapp_adapter(config: ProviderConfig, transport: Transport) -> ConfiguredAdapter:
    return connector_adapter("meta-whatsapp-cloud", config, transport)
