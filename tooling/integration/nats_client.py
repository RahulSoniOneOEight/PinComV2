from __future__ import annotations

import inspect
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator


async def connect_nats(url: str) -> Any:
    try:
        import nats
    except ImportError as exc:
        raise RuntimeError("nats-py is required for the live NATS binding") from exc
    return await nats.connect(url)


async def close_nats(connection: Any, *, drain: bool = True) -> None:
    """Drain and close a NATS connection.

    ``drain`` flushes pending subscriptions before closing; set it to ``False``
    for a hard close. Safe to call with ``None``.
    """
    if connection is None:
        return
    if drain:
        drain_fn = getattr(connection, "drain", None)
        if callable(drain_fn):
            result = drain_fn()
            if inspect.isawaitable(result):
                await result
    close_fn = getattr(connection, "close", None)
    if callable(close_fn):
        result = close_fn()
        if inspect.isawaitable(result):
            await result


@asynccontextmanager
async def nats_connection(url: str) -> AsyncIterator[Any]:
    """Async context manager that guarantees the NATS connection is drained/closed."""
    connection = await connect_nats(url)
    try:
        yield connection
    finally:
        await close_nats(connection)
