from __future__ import annotations

import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tooling.integration.runtime import Claim, DeliveryResult


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SQLiteRuntimeStore:
    def __init__(self, path: str | Path, *, timeout: float = 30.0):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path, timeout=timeout)
        self.conn.row_factory = sqlite3.Row
        self._closed = False
        # Allow concurrent workers to serialize on the database rather than
        # failing fast with "database is locked". busy_timeout must be set
        # before switching journal mode, and the switch itself is retried
        # because several workers may open the same file simultaneously.
        self.conn.execute("pragma busy_timeout = 30000")
        for attempt in range(10):
            try:
                self.conn.execute("pragma journal_mode = wal")
                break
            except sqlite3.OperationalError:
                if attempt == 9:
                    raise
                time.sleep(0.1 * (attempt + 1))
        self._init_schema()

    def close(self) -> None:
        """Close the underlying SQLite connection. Safe to call more than once."""
        if not self._closed:
            self.conn.close()
            self._closed = True

    def __enter__(self) -> "SQLiteRuntimeStore":
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
        self.conn.executescript(
            """
            create table if not exists idempotency (
                key text primary key,
                state text not null default 'completed',
                result_json text not null default '',
                updated_at text
            );
            create table if not exists audit (
                id integer primary key autoincrement,
                event_json text not null
            );
            create table if not exists dead_letter (
                dead_letter_id text primary key,
                payload_json text not null
            );
            """
        )
        self._migrate()
        self.conn.commit()

    def _migrate(self) -> None:
        columns = {
            row["name"]
            for row in self.conn.execute("pragma table_info(idempotency)").fetchall()
        }
        if "state" not in columns:
            self.conn.execute(
                "alter table idempotency add column state text not null default 'completed'"
            )
        if "result_json" not in columns:
            self.conn.execute(
                "alter table idempotency add column result_json text not null default ''"
            )
        if "updated_at" not in columns:
            self.conn.execute("alter table idempotency add column updated_at text")

    @staticmethod
    def _decode(raw: Any) -> DeliveryResult | None:
        if not raw:
            return None
        return DeliveryResult(**json.loads(raw))

    # -- idempotency -----------------------------------------------------
    def get_result(self, key: str) -> DeliveryResult | None:
        row = self.conn.execute(
            "select result_json from idempotency where key = ?", (key,)
        ).fetchone()
        if not row:
            return None
        return self._decode(row["result_json"])

    def put_result(self, key: str, result: DeliveryResult) -> None:
        self.conn.execute(
            """
            insert into idempotency(key, state, result_json, updated_at)
            values (?, 'completed', ?, ?)
            on conflict(key) do update
            set state = 'completed', result_json = excluded.result_json,
                updated_at = excluded.updated_at
            """,
            (key, json.dumps(result.__dict__, sort_keys=True), _now()),
        )
        self.conn.commit()

    def claim(self, key: str) -> Claim:
        """Atomically acquire an idempotency key.

        The ``insert ... on conflict do nothing`` is a single atomic statement, so
        exactly one concurrent worker can win a new or previously-failed key.
        """
        cursor = self.conn.execute(
            """
            insert into idempotency(key, state, result_json, updated_at)
            values (?, 'processing', '', ?)
            on conflict(key) do nothing
            """,
            (key, _now()),
        )
        self.conn.commit()
        if cursor.rowcount == 1:
            return Claim(True, "acquired")

        row = self.conn.execute(
            "select state, result_json from idempotency where key = ?", (key,)
        ).fetchone()
        if row is None:  # pathological race; retry once
            return self.claim(key)

        state = row["state"]
        if state == "completed":
            return Claim(False, "completed", self._decode(row["result_json"]))
        if state == "processing":
            return Claim(False, "in_progress")

        # state == 'failed' (or any retryable state): atomically re-acquire.
        updated = self.conn.execute(
            """
            update idempotency set state = 'processing', updated_at = ?
            where key = ? and state = 'failed'
            """,
            (_now(), key),
        )
        self.conn.commit()
        if updated.rowcount == 1:
            return Claim(True, "acquired")
        return Claim(False, "in_progress")

    def complete(self, key: str, result: DeliveryResult) -> None:
        self._set_state(key, "completed", result)

    def fail(self, key: str, result: DeliveryResult) -> None:
        self._set_state(key, "failed", result)

    def _set_state(self, key: str, state: str, result: DeliveryResult) -> None:
        self.conn.execute(
            """
            update idempotency set state = ?, result_json = ?, updated_at = ?
            where key = ?
            """,
            (state, json.dumps(result.__dict__, sort_keys=True), _now(), key),
        )
        self.conn.commit()

    def release(self, key: str) -> None:
        self.conn.execute(
            "delete from idempotency where key = ? and state = 'processing'", (key,)
        )
        self.conn.commit()

    # -- audit / dead letters -------------------------------------------
    def append_audit(self, event: dict[str, Any]) -> None:
        self.conn.execute(
            "insert into audit(event_json) values (?)",
            (json.dumps(event, sort_keys=True),),
        )
        self.conn.commit()

    def put_dead_letter(self, dead_letter: dict[str, Any]) -> None:
        self.conn.execute(
            "insert or replace into dead_letter(dead_letter_id, payload_json) values (?, ?)",
            (
                dead_letter["dead_letter_id"],
                json.dumps(dead_letter, sort_keys=True),
            ),
        )
        self.conn.commit()

    def get_dead_letter(self, dead_letter_id: str) -> dict[str, Any] | None:
        row = self.conn.execute(
            "select payload_json from dead_letter where dead_letter_id = ?",
            (dead_letter_id,),
        ).fetchone()
        if not row:
            return None
        return json.loads(row["payload_json"])

    def list_dead_letters(self) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            "select payload_json from dead_letter order by dead_letter_id"
        ).fetchall()
        return [json.loads(row["payload_json"]) for row in rows]
