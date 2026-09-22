"""Tryton JSON-RPC transport for ``erp.create_sales_order``.

This is a provider-specific transport behind the existing provider-neutral ERP
adapter. It talks to Tryton's native JSON-RPC API (Tryton 8 exposes
``POST /<database>/rpc/``); it does not invent a REST abstraction.

Flow for one command:
    authenticate (common.db.login)
    -> ensure deterministic master data (currency, company, party, product)
    -> resolve-or-create the sale order by its external reference
    -> create the order line(s)
    -> return a normalized result to the ERP adapter

The transport raises on provider errors; the ``ConfiguredAdapter`` boundary
converts those into a failed ``DeliveryResult`` so failures stay observable.

Credentials come from ``ProviderConfig.token`` as ``"user:password"`` (or just
the password, with the user from ``TRYTON_USER``). The database comes from
``TRYTON_DB`` (default ``tryton``). No credentials are ever logged.
"""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from typing import Any

from tooling.integration.adapters import ProviderConfig
from tooling.integration.runtime import DomainCommand

# Deterministic staging master data (idempotently created when absent).
DEFAULT_COMPANY_PARTY_CODE = "PCM-COMPANY"
DEFAULT_COMPANY_NAME = "PinCommerce Staging"
DEFAULT_PRODUCT_CODE = "PCM-REFERENCE"
DEFAULT_PRODUCT_NAME = "PinCommerce Reference Product"
DEFAULT_CURRENCY_CODE = "INR"
DEFAULT_UOM_NAME = "Unit"
WALK_IN_PARTY_CODE = "PCM-WALKIN"


class TrytonError(RuntimeError):
    pass


class TrytonJSONRPCClient:
    def __init__(
        self,
        base_url: str,
        database: str,
        user: str,
        password: str,
        *,
        timeout: int = 30,
    ):
        self.base_url = base_url.rstrip("/")
        self.database = database
        self.user = user
        self.password = password
        self.timeout = timeout
        self.user_id: int | None = None
        self._auth: str | None = None

    # -- protocol --------------------------------------------------------
    def _rpc(self, method: str, params: list[Any]) -> Any:
        headers = {"Content-Type": "application/json"}
        if self._auth:
            headers["Authorization"] = "session " + self._auth
        request = urllib.request.Request(
            f"{self.base_url}/{self.database}/rpc/",
            data=json.dumps({"id": 1, "method": method, "params": params}).encode(),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")
            raise TrytonError(f"tryton http {exc.code}: {body[:300]}") from exc
        except urllib.error.URLError as exc:
            raise TrytonError(f"tryton unreachable: {exc.reason}") from exc
        try:
            payload = json.loads(raw)
        except ValueError as exc:
            raise TrytonError(f"tryton returned a malformed response: {raw[:200]}") from exc
        if not isinstance(payload, dict):
            raise TrytonError(f"tryton returned an unexpected response: {raw[:200]}")
        if "error" in payload:
            raise TrytonError(f"tryton {method} failed: {payload['error']}")
        return payload.get("result")

    def login(self) -> int:
        result = self._rpc(
            "common.db.login", [self.user, {"password": self.password}]
        )
        if not isinstance(result, list) or len(result) < 2:
            raise TrytonError("tryton login returned an unexpected response")
        self.user_id = int(result[0])
        token = result[1]
        self._auth = base64.b64encode(
            f"{self.user}:{self.user_id}:{token}".encode()
        ).decode()
        return self.user_id

    def call(self, model: str, method: str, *args: Any, context: dict | None = None) -> Any:
        return self._rpc(f"model.{model}.{method}", [*args, context or {}])

    def search_read(
        self,
        model: str,
        domain: list,
        fields: list[str],
        *,
        limit: int = 1,
        context: dict | None = None,
    ) -> list[dict]:
        return self.call(
            model, "search_read", domain, 0, limit, None, fields, context=context
        )

    def create(self, model: str, values: dict, *, context: dict | None = None) -> int:
        result = self.call(model, "create", [values], context=context)
        return int(result[0]) if isinstance(result, list) else int(result)

    def write(self, model: str, ids: list[int], values: dict, *, context: dict | None = None) -> None:
        self.call(model, "write", ids, values, context=context)


def _credentials(config: ProviderConfig) -> tuple[str, str]:
    token = config.token or os.getenv("TRYTON_PASSWORD")
    if not token:
        raise TrytonError("no Tryton credentials provided")
    if ":" in token:
        user, _, password = token.partition(":")
        return user, password
    return os.getenv("TRYTON_USER", "admin"), token


# -- deterministic master data ------------------------------------------
def _ensure_currency(client: TrytonJSONRPCClient, code: str | None) -> int:
    code = (code or DEFAULT_CURRENCY_CODE).upper()
    found = client.search_read("currency.currency", [("code", "=", code)], ["code"])
    if found:
        return int(found[0]["id"])
    return client.create(
        "currency.currency",
        {
            "code": code,
            "name": code,
            "symbol": code,
            "rounding": "0.01",
            "digits": 2,
        },
    )


def _ensure_company(client: TrytonJSONRPCClient, currency_id: int) -> int:
    found = client.search_read("company.company", [], ["party"])
    if found:
        return int(found[0]["id"])
    party_id = _ensure_party(
        client, DEFAULT_COMPANY_PARTY_CODE, DEFAULT_COMPANY_NAME
    )
    company_id = client.create(
        "company.company", {"party": party_id, "currency": currency_id}
    )
    return company_id


def _ensure_party(client: TrytonJSONRPCClient, code: str, name: str) -> int:
    found = client.search_read("party.party", [("code", "=", code)], ["code"])
    if found:
        return int(found[0]["id"])
    return client.create("party.party", {"code": code, "name": name})


def _ensure_user_company(client: TrytonJSONRPCClient, company_id: int) -> None:
    if client.user_id is None:
        raise TrytonError("Tryton client is not authenticated")
    client.write(
        "res.user",
        [client.user_id],
        {"company": company_id, "companies": [["add", [company_id]]]},
    )


def _ensure_uom(client: TrytonJSONRPCClient) -> int:
    found = client.search_read(
        "product.uom", [("name", "=", DEFAULT_UOM_NAME)], ["name"]
    )
    if found:
        return int(found[0]["id"])
    any_uom = client.search_read("product.uom", [], ["name"], limit=1)
    if not any_uom:
        raise TrytonError("no unit of measure configured in Tryton")
    return int(any_uom[0]["id"])


def _ensure_reference_product(
    client: TrytonJSONRPCClient, company_id: int
) -> tuple[int, int]:
    """Return (product_id, uom_id) for the deterministic reference product.

    The product template is always (re)marked salable with a sale UoM so the
    sale line passes Tryton's product domain on both fresh and existing data.
    """
    uom_id = _ensure_uom(client)
    context = {"company": company_id}

    found = client.search_read(
        "product.product",
        [("code", "=", DEFAULT_PRODUCT_CODE)],
        ["code", "template"],
    )
    if found:
        product_id = int(found[0]["id"])
        template = found[0]["template"]
        template_id = int(template[0] if isinstance(template, list) else template)
    else:
        templates = client.search_read(
            "product.template", [("name", "=", DEFAULT_PRODUCT_NAME)], ["name"]
        )
        if templates:
            template_id = int(templates[0]["id"])
        else:
            template_id = client.create(
                "product.template",
                {
                    "name": DEFAULT_PRODUCT_NAME,
                    "type": "goods",
                    "default_uom": uom_id,
                    "sale_uom": uom_id,
                    "salable": True,
                },
                context=context,
            )
        variants = client.search_read(
            "product.product", [("template", "=", template_id)], ["code"]
        )
        product_id = (
            int(variants[0]["id"])
            if variants
            else client.create(
                "product.product",
                {"template": template_id, "code": DEFAULT_PRODUCT_CODE},
            )
        )

    client.write(
        "product.template",
        [template_id],
        {"salable": True, "sale_uom": uom_id},
        context=context,
    )
    return product_id, uom_id


# -- command transport ---------------------------------------------------
def _sale_defaults(client: TrytonJSONRPCClient, context: dict) -> dict:
    fields = [
        "state",
        "invoice_method",
        "shipment_method",
        "invoice_state",
        "shipment_state",
    ]
    return client.call("sale.sale", "default_get", fields, context=context)


def _sale_date(occurred_at: str | None) -> str | None:
    if not occurred_at or len(occurred_at) < 10:
        return None
    candidate = occurred_at[:10]
    if candidate[4] == "-" and candidate[7] == "-":
        return candidate
    return None


def tryton_sales_order_transport(
    config: ProviderConfig, command: DomainCommand
) -> dict[str, Any]:
    if config.provider != "tryton":
        raise TrytonError("Expected tryton provider config")
    if command.command_type != "erp.create_sales_order":
        raise TrytonError(f"Unsupported command type: {command.command_type}")

    payload = command.payload
    order_reference = str(payload.get("order_id") or command.command_id)
    tenant_id = str(payload.get("tenant_id") or "")
    customer_code = str(payload.get("customer_id") or WALK_IN_PARTY_CODE)

    user, password = _credentials(config)
    database = os.getenv("TRYTON_DB", "tryton")
    client = TrytonJSONRPCClient(
        config.base_url, database, user, password,
        timeout=config.timeout_seconds,
    )
    client.login()

    currency_id = _ensure_currency(client, payload.get("currency"))
    company_id = _ensure_company(client, currency_id)
    _ensure_user_company(client, company_id)
    context = {"company": company_id}
    party_id = _ensure_party(client, customer_code, customer_code)
    product_id, uom_id = _ensure_reference_product(client, company_id)

    # Tryton-side duplicate protection: one order per external reference.
    existing = client.search_read(
        "sale.sale", [("reference", "=", order_reference)], ["reference"],
        context=context,
    )
    if existing:
        sale_id = int(existing[0]["id"])
        return {
            "success": True,
            "external_id": str(sale_id),
            "raw": {"sale_id": sale_id, "reused": True, "reference": order_reference},
        }

    values: dict[str, Any] = {
        **_sale_defaults(client, context),
        "company": company_id,
        "currency": currency_id,
        "party": party_id,
        "reference": order_reference,
        "description": f"{tenant_id}:{order_reference}".strip(":"),
    }
    sale_date = _sale_date(payload.get("occurred_at"))
    if sale_date:
        values["sale_date"] = sale_date

    sale_id = client.create("sale.sale", values, context=context)

    total = payload.get("total")
    line_values: dict[str, Any] = {
        "sale": sale_id,
        "type": "line",
        "product": product_id,
        "quantity": 1,
        "unit": uom_id,
        "description": order_reference,
    }
    if isinstance(total, (int, float, str)):
        line_values["unit_price"] = str(total)
    line_id = client.create("sale.line", line_values, context=context)

    return {
        "success": True,
        "external_id": str(sale_id),
        "raw": {
            "sale_id": sale_id,
            "line_id": line_id,
            "reference": order_reference,
            "party_id": party_id,
            "product_id": product_id,
        },
    }
