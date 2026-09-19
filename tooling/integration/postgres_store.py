from __future__ import annotations

import json
from typing import Any

from tooling.integration.runtime import DeliveryResult


class PostgresRuntimeStore:
    """Production durable store backed by PostgreSQL.

    The connection object follows Python DB-API semantics so tests can use
    compatible fakes and deployment can supply psycopg connections.
    """

    def __init__(self, connection: Any):
        self.conn = connection
        self._init_schema()

    def _init_schema(self) -> None:
        with self.conn.cursor() as cur:
            cur.execute("""
                create table if not exists integration_idempotency (
                    key text primary key,
                    result_json jsonb not null,
                    created_at timestamptz not null default now()
                )
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

    def get_result(self, key: str) -> DeliveryResult | None:
        with self.conn.cursor() as cur:
            cur.execute(
                "select result_json from integration_idempotency where key = %s",
                (key,),
            )
            row = cur.fetchone()
        if not row:
            return None
        data = row[0] if isinstance(row[0], dict) else json.loads(row[0])
        return DeliveryResult(**data)

    def put_result(self, key: str, result: DeliveryResult) -> None:
        payload = json.dumps(result.__dict__, sort_keys=True)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                insert into integration_idempotency(key, result_json)
                values (%s, %s::jsonb)
                on conflict(key) do update set result_json = excluded.result_json
                """,
                (key, payload),
            )
        self.conn.commit()

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
