from __future__ import annotations

from typing import Any


async def connect_nats(url: str) -> Any:
    try:
        import nats
    except ImportError as exc:
        raise RuntimeError("nats-py is required for the live NATS binding") from exc
    return await nats.connect(url)
