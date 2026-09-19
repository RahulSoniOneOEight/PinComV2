from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class TelemetryRecord:
    kind: str
    name: str
    attributes: dict[str, Any]
    observed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TelemetryBuffer:
    def __init__(self) -> None:
        self.records: list[TelemetryRecord] = []

    def metric(self, name: str, **attributes: Any) -> None:
        self.records.append(TelemetryRecord("metric", name, attributes))

    def trace(self, name: str, **attributes: Any) -> None:
        self.records.append(TelemetryRecord("trace", name, attributes))

    def error(self, name: str, **attributes: Any) -> None:
        self.records.append(TelemetryRecord("error", name, attributes))

    def snapshot(self) -> list[dict[str, Any]]:
        return [
            {
                "kind": r.kind,
                "name": r.name,
                "attributes": r.attributes,
                "observed_at": r.observed_at,
            }
            for r in self.records
        ]
