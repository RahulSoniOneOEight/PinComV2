"""Provider-specific integration transports.

Transports live behind the provider-neutral adapter boundary. They expose the
same callable interface as ``tooling.integration.http_transport.execute_http``:

    transport(config: ProviderConfig, command: DomainCommand) -> dict

returning a normalized ``{"success": ..., "external_id": ..., "error": ...}``
mapping that the ERP adapter turns into a ``DeliveryResult``.
"""
