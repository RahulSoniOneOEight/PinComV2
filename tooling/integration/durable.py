from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from tooling.integration.runtime import DeliveryResult


class SQLiteRuntimeStore:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.executescript(
            """
            create table if not exists idempotency (
                key text primary key,
                result_json text not null
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
        self.conn.commit()

    def get_result(self, key: str) -> DeliveryResult | None:
        row = self.conn.execute(
            "select result_json from idempotency where key = ?", (key,)
        ).fetchone()
        if not row:
            return None
        data = json.loads(row["result_json"])
        return DeliveryResult(**data)

    def put_result(self, key: str, result: DeliveryResult) -> None:
        self.conn.execute(
            "insert or replace into idempotency(key, result_json) values (?, ?)",
            (key, json.dumps(result.__dict__, sort_keys=True)),
        )
        self.conn.commit()

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

    def list_dead_letters(self) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            "select payload_json from dead_letter order by dead_letter_id"
        ).fetchall()
        return [json.loads(row["payload_json"]) for row in rows]
