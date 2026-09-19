from __future__ import annotations

import json
import urllib.request
from typing import Any


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> int:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.status


def export_otlp_http(endpoint: str, records: list[dict[str, Any]], token: str | None = None) -> int:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return post_json(endpoint, {"resourceSpans": records}, headers)


def export_sentry_event(dsn_endpoint: str, event: dict[str, Any]) -> int:
    return post_json(dsn_endpoint, event)


def export_grafana_annotation(endpoint: str, text: str, tags: list[str] | None = None) -> int:
    return post_json(endpoint, {"text": text, "tags": tags or []})
