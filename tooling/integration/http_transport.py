from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from tooling.integration.adapters import ProviderConfig
from tooling.integration.runtime import DomainCommand


class HTTPTransportError(RuntimeError):
    pass


def command_endpoint(command_type: str) -> str:
    mapping = {
        "erp.create_sales_order": "/api/erp/sales-orders",
        "erp.reserve_inventory": "/api/erp/inventory/reservations",
        "erp.create_return": "/api/erp/returns",
        "search.index_product": "/indexes/products/documents",
        "support.open_conversation": "/api/v1/conversations",
        "automation.trigger_flow": "/api/v1/flows/trigger",
        "marketplace.sync_seller": "/api/marketplace/sellers/sync",
        "commerce.create_order": "/store/orders",
        "commerce.cancel_order": "/admin/orders/cancel",
        "payments.create_order": "/payments/orders",
        "payments.capture": "/payments/capture",
        "payments.refund": "/payments/refunds",
        "logistics.create_shipment": "/shipments",
        "logistics.cancel_shipment": "/shipments/cancel",
        "logistics.track_shipment": "/shipments/track",
        "messaging.send_whatsapp": "/messages",
    }
    if command_type not in mapping:
        raise HTTPTransportError(f"No HTTP endpoint mapping for {command_type}")
    return mapping[command_type]


def execute_http(config: ProviderConfig, command: DomainCommand) -> dict[str, Any]:
    endpoint = command_endpoint(command.command_type)
    url = config.base_url.rstrip("/") + endpoint
    body = json.dumps(command.payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Idempotency-Key": command.idempotency_key,
        "X-Correlation-Id": command.correlation_id or command.command_id,
    }
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"

    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=config.timeout_seconds) as response:
            raw = response.read().decode("utf-8") or "{}"
            parsed = json.loads(raw)
            external_id = (
                parsed.get("id")
                or parsed.get("external_id")
                or parsed.get("data", {}).get("id")
            )
            return {
                "success": 200 <= response.status < 300,
                "external_id": external_id,
                "status_code": response.status,
                "raw": parsed,
            }
    except urllib.error.HTTPError as exc:
        return {
            "success": False,
            "error": f"http-{exc.code}",
            "status_code": exc.code,
        }
    except urllib.error.URLError as exc:
        raise HTTPTransportError(str(exc.reason)) from exc
