from __future__ import annotations

import json
from typing import Any

from tooling.integration.runtime import Claim, DeliveryResult


class PostgresRuntimeStore:
    """Production durable store backed by PostgreSQL.

    The connection object follows Python DB-API semantics so tests can use
    compatible fakes and deployment can supply psycopg connections.
    """

    def __init__(self, connection: Any):
        self.conn = connection
        self._closed = False
        self._init_schema()

    def close(self) -> None:
        """Close the underlying DB-API connection. Safe to call more than once."""
        if not self._closed:
            close = getattr(self.conn, "close", None)
            if callable(close):
                close()
            self._closed = True

    def __enter__(self) -> "PostgresRuntimeStore":
        return self

    def __exit__(self, *exc_info: object) -> bool:
        self.close()
        return False

    def __del__(self) -> None:  # safety net only; callers should use close()
        try:
            self.close()
        except Exception:
            pass

    def _init_schema(self) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                create table if not exists integration_idempotency (
                    key text primary key,
                    state text not null default 'completed',
                    result_json jsonb,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
            """)
            cur.execute("""
                alter table integration_idempotency
                add column if not exists state text not null default 'completed'
            """)
            cur.execute("""
                alter table integration_idempotency
                add column if not exists updated_at timestamptz not null default now()
            """)
            cur.execute("""
                alter table integration_idempotency
                alter column result_json drop not null
            """)
            cur.execute("""
                create table if not exists integration_audit (
                    id bigserial primary key,
                    event_json jsonb not null,
                    created_at timestamptz not null default now()
                )
            """)
            cur.execute("""
                create table if not exists integration_dead_letter (
                    dead_letter_id text primary key,
                    payload_json jsonb not null,
                    updated_at timestamptz not null default now()
                )
            """)
        self.conn.commit()

    @staticmethod
    def _decode(raw: Any) -> DeliveryResult | None:
        if not raw:
            return None
        data = raw if isinstance(raw, dict) else json.loads(raw)
        return DeliveryResult(**data)

    # -- idempotency -----------------------------------------------------
    def get_result(self, key: str) -> DeliveryResult | None:
        with self.conn.cursor() as cur:
            cur.execute(
                "select result_json from integration_idempotency where key = %s",
                (key,),
            )
            row = cur.fetchone()
        if not row:
            return None
        return self._decode(row[0])

    def put_result(self, key: str, result: DeliveryResult) -> None:
        payload = json.dumps(result.__dict__, sort_keys=True)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                insert into integration_idempotency(key, state, result_json)
                values (%s, 'completed', %s::jsonb)
                on conflict(key) do update
                set state = 'completed', result_json = excluded.result_json,
                    updated_at = now()
                """,
                (key, payload),
            )
        self.conn.commit()

    def claim(self, key: str) -> Claim:
        """Atomically acquire an idempotency key via a unique insert."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                insert into integration_idempotency(key, state, result_json)
                values (%s, 'processing', null)
                on conflict(key) do nothing
                """,
                (key,),
            )
            inserted = cur.rowcount == 1
        self.conn.commit()
        if inserted:
            return Claim(True, "acquired")

        with self.conn.cursor() as cur:
            cur.execute(
                "select state, result_json from integration_idempotency where key = %s",
                (key,),
            )
            row = cur.fetchone()
        if row is None:
            return self.claim(key)

        state, raw = row
        if state == "completed":
            return Claim(False, "completed", self._decode(raw))
        if state == "processing":
            return Claim(False, "in_progress")

        with self.conn.cursor() as cur:
            cur.execute(
                """
                update integration_idempotency
                set state = 'processing', updated_at = now()
                where key = %s and state = 'failed'
                """,
                (key,),
            )
            updated = cur.rowcount == 1
        self.conn.commit()
        if updated:
            return Claim(True, "acquired")
        return Claim(False, "in_progress")

    def complete(self, key: str, result: DeliveryResult) -> None:
        self._set_state(key, "completed", result)

    def fail(self, key: str, result: DeliveryResult) -> None:
        self._set_state(key, "failed", result)

    def _set_state(self, key: str, state: str, result: DeliveryResult) -> None:
        payload = json.dumps(result.__dict__, sort_keys=True)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                update integration_idempotency
                set state = %s, result_json = %s::jsonb, updated_at = now()
                where key = %s
                """,
                (state, payload, key),
            )
        self.conn.commit()

    def release(self, key: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "delete from integration_idempotency where key = %s and state = 'processing'",
                (key,),
            )
        self.conn.commit()

    # -- audit / dead letters -------------------------------------------
    def append_audit(self, event: dict[str, Any]) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "insert into integration_audit(event_json) values (%s::jsonb)",
                (json.dumps(event, sort_keys=True),),
            )
        self.conn.commit()

    def put_dead_letter(self, dead_letter: dict[str, Any]) -> None:
        payload = json.dumps(dead_letter, sort_keys=True)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                insert into integration_dead_letter(dead_letter_id, payload_json)
                values (%s, %s::jsonb)
                on conflict(dead_letter_id) do update
                set payload_json = excluded.payload_json, updated_at = now()
                """,
                (dead_letter["dead_letter_id"], payload),
            )
        self.conn.commit()

    def get_dead_letter(self, dead_letter_id: str) -> dict[str, Any] | None:
        with self.conn.cursor() as cur:
            cur.execute(
                "select payload_json from integration_dead_letter where dead_letter_id = %s",
                (dead_letter_id,),
            )
            row = cur.fetchone()
        if not row:
            return None
        value = row[0]
        return value if isinstance(value, dict) else json.loads(value)

    def list_dead_letters(self) -> list[dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(
                "select payload_json from integration_dead_letter order by dead_letter_id"
            )
            rows = cur.fetchall()
        return [
            value if isinstance(value, dict) else json.loads(value)
            for (value,) in rows
        ]


def connect_postgres(dsn: str) -> PostgresRuntimeStore:
    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError(
            "psycopg is required for the PostgreSQL runtime store"
        ) from exc
    return PostgresRuntimeStore(psycopg.connect(dsn))
