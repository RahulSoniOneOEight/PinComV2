"""JetStream consumer for canonical order.created.v1 events.

This is the integration runtime boundary: it consumes canonical events from the
existing PinCommerce staging NATS JetStream, validates them against the
order.created.v1 contract, and hands them to the existing ``order_created``
handler. Tryton-specific logic stays in the provider transport; this module only
deals with the event bus and the durable runtime.

Idempotency, retries, completed replay and dead-lettering are all provided by
the durable store/runtime, so the consumer can safely ack a message once the
handler returns: a redelivered or replayed message never produces a second ERP
write.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from typing import Any

from tooling.integration.adapters import ProviderConfig, tryton_adapter
from tooling.integration.durable import SQLiteRuntimeStore
from tooling.integration.nats_client import close_nats, connect_nats
from tooling.integration.order_created import (
    OrderCreatedError,
    handle_order_created,
    load_event,
    validate_order_created,
)
from tooling.integration.production_runtime import ProductionIntegrationRuntime
from tooling.integration.providers.tryton import tryton_sales_order_transport

STREAM = "PINCOMMERCE"
SUBJECT = "pinaka.events.order.created"
DURABLE = "order-created-consumer"


async def ensure_stream(nc: Any) -> None:
    js = nc.jetstream()
    try:
        await js.add_stream(name=STREAM, subjects=["pinaka.events.>"])
    except Exception:
        # Already exists; verify it is usable below by fetching stream info.
        await js.stream_info(STREAM)


async def publish_event(nc: Any, event: dict[str, Any]) -> Any:
    await ensure_stream(nc)
    payload = json.dumps(event, sort_keys=True).encode("utf-8")
    return await nc.jetstream().publish(
        SUBJECT, payload, headers={"Nats-Msg-Id": event["event_id"]}
    )


def _runtime(store_path: Path, base_url: str, token: str | None) -> ProductionIntegrationRuntime:
    runtime = ProductionIntegrationRuntime(
        SQLiteRuntimeStore(store_path), sleep=lambda _: None
    )
    config = ProviderConfig(provider="tryton", base_url=base_url, token=token)
    runtime.register("erp", tryton_adapter(config, tryton_sales_order_transport))
    return runtime


async def consume(
    *,
    store_path: Path,
    base_url: str,
    token: str | None,
    nats_url: str,
    max_messages: int,
    timeout: int,
    ack: bool,
) -> list[dict[str, Any]]:
    nc = await connect_nats(nats_url)
    results: list[dict[str, Any]] = []
    runtime = _runtime(store_path, base_url, token)
    try:
        await ensure_stream(nc)
        subscription = await nc.jetstream().pull_subscribe(
            SUBJECT, durable=DURABLE, stream=STREAM
        )
        processed = 0
        deadline = asyncio.get_event_loop().time() + timeout
        while processed < max_messages and asyncio.get_event_loop().time() < deadline:
            try:
                messages = await subscription.fetch(1, timeout=2)
            except Exception:
                continue
            for message in messages:
                try:
                    event = json.loads(message.data.decode("utf-8"))
                except ValueError:
                    await message.term()
                    results.append({"event_id": None, "status": "malformed"})
                    processed += 1
                    continue

                errors = validate_order_created(event)
                if errors:
                    await message.term()
                    results.append(
                        {"event_id": event.get("event_id"), "status": "invalid", "errors": errors}
                    )
                    processed += 1
                    continue

                result = handle_order_created(event, runtime)
                delivery = result["delivery"]
                if ack:
                    await message.ack()
                results.append(
                    {
                        "event_id": event["event_id"],
                        "entity_id": event["entity_id"],
                        "status": "completed" if delivery.success else "failed",
                        "external_id": delivery.external_id,
                        "replayed": not delivery.pending and delivery.attempt == 0,
                        "acked": ack,
                    }
                )
                processed += 1
        return results
    finally:
        await close_nats(nc)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Consume canonical order.created.v1 events from JetStream"
    )
    parser.add_argument("--store", type=Path, required=True)
    parser.add_argument("--tryton-base-url", default=os.getenv("TRYTON_BASE_URL"))
    parser.add_argument("--tryton-token", default=os.getenv("TRYTON_TOKEN"))
    parser.add_argument("--nats-url", default=os.getenv("NATS_URL", "nats://127.0.0.1:4222"))
    parser.add_argument("--max-messages", type=int, default=1)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--no-ack", action="store_true", help="Fetch without acking (redelivery test)")
    parser.add_argument(
        "--publish",
        type=Path,
        default=None,
        help="Publish an event file to JetStream and exit (replay helper)",
    )
    args = parser.parse_args()

    if args.publish is not None:
        event = load_event(args.publish)
        errors = validate_order_created(event)
        if errors:
            print("invalid event: " + "; ".join(errors))
            return 2
        nc = asyncio.run(_publish_and_close(args.publish, args.nats_url))
        print(f"published {nc}")
        return 0

    if not args.tryton_base_url:
        print("consumer-error: TRYTON_BASE_URL is required")
        return 2

    results = asyncio.run(
        consume(
            store_path=args.store,
            base_url=args.tryton_base_url,
            token=args.tryton_token,
            nats_url=args.nats_url,
            max_messages=args.max_messages,
            timeout=args.timeout,
            ack=not args.no_ack,
        )
    )
    for result in results:
        print(json.dumps(result, sort_keys=True))
    return 0


async def _publish_and_close(path: Path, nats_url: str) -> str:
    event = load_event(path)
    nc = await connect_nats(nats_url)
    try:
        ack = await publish_event(nc, event)
        return f"stream={ack.stream} seq={ack.seq} event_id={event['event_id']}"
    finally:
        await close_nats(nc)


if __name__ == "__main__":
    raise SystemExit(main())
