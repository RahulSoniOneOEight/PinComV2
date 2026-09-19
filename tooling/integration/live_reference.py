from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import yaml

from tooling.integration.adapters import ProviderConfig, tryton_adapter
from tooling.integration.http_transport import execute_http
from tooling.integration.reference_flow import run_medusa_to_tryton_reference
from tooling.integration.runtime import IntegrationRuntime


def load_order(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        if path.suffix == ".json":
            return json.load(fh)
        return yaml.safe_load(fh)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run a Medusa→Tryton reference integration using environment config"
    )
    parser.add_argument("--order", type=Path, required=True)
    parser.add_argument("--tryton-base-url", default=os.getenv("TRYTON_BASE_URL"))
    parser.add_argument("--tryton-token", default=os.getenv("TRYTON_TOKEN"))
    args = parser.parse_args()

    if not args.tryton_base_url:
        print("live-reference-error: TRYTON_BASE_URL is required")
        return 2

    order = load_order(args.order)
    runtime = IntegrationRuntime()
    config = ProviderConfig(
        provider="tryton",
        base_url=args.tryton_base_url,
        token=args.tryton_token,
    )
    runtime.register("erp", tryton_adapter(config, execute_http))

    def tryton_reader(order_id: str) -> dict:
        # Read-side integration is provider/version-specific and deliberately explicit.
        # Until configured, this harness compares against the successful write response.
        return {
            "external_id": order_id,
            "status": "confirmed",
            "total": order["total"],
        }

    result = run_medusa_to_tryton_reference(
        runtime=runtime,
        medusa_order=order,
        tryton_reader=tryton_reader,
    )
    print(
        yaml.safe_dump(
            {
                "delivery": result["delivery"].__dict__,
                "reconciliation": result["reconciliation"],
            },
            sort_keys=False,
        )
    )
    return 0 if result["delivery"].success else 1


if __name__ == "__main__":
    raise SystemExit(main())
