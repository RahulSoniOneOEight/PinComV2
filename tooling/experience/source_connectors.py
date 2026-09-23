from __future__ import annotations

import json
import os
import re
import urllib.request
from html.parser import HTMLParser
from typing import Any, Callable

from tooling.experience.source_ingestion import ingest


class ConnectorError(RuntimeError):
    pass


def _json_get(url: str, headers: dict[str, str] | None = None, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    request = urllib.request.Request(url, headers=headers or {})
    with opener(request, timeout=30) as response:
        value = json.loads(response.read().decode("utf-8"))
    if not isinstance(value, dict):
        raise ConnectorError(f"Expected JSON object from {url}")
    return value


def fetch_figma(file_key: str, *, token: str | None = None, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    token = token or os.getenv("FIGMA_TOKEN")
    if not token:
        raise ConnectorError("FIGMA_TOKEN is required")
    payload = _json_get(f"https://api.figma.com/v1/files/{file_key}", {"X-Figma-Token": token}, opener)
    normalized = {
        "file_key": file_key,
        "components": [{"id": k, **v} for k, v in payload.get("components", {}).items()] if isinstance(payload.get("components"), dict) else [],
        "componentSets": [{"id": k, **v} for k, v in payload.get("componentSets", {}).items()] if isinstance(payload.get("componentSets"), dict) else [],
        "variables": payload.get("variables", {}),
        "notes": [f"name:{payload.get('name', '')}"],
    }
    return ingest("figma", f"figma:{file_key}", normalized)


def fetch_penpot(project_id: str, *, api_url: str | None = None, token: str | None = None, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    api_url = api_url or os.getenv("PENPOT_API_URL")
    token = token or os.getenv("PENPOT_TOKEN")
    if not api_url or not token:
        raise ConnectorError("PENPOT_API_URL and PENPOT_TOKEN are required")
    url = api_url.rstrip("/") + f"/projects/{project_id}/design-export"
    payload = _json_get(url, {"Authorization": f"Bearer {token}"}, opener)
    payload = {"project_id": project_id, **payload}
    return ingest("penpot", f"penpot:{project_id}", payload)


class _ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stylesheets: list[str] = []
        self.meta: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k: v or "" for k, v in attrs}
        if tag == "link" and "stylesheet" in values.get("rel", "") and values.get("href"):
            self.stylesheets.append(values["href"])
        if tag == "meta" and (values.get("name") or values.get("property")):
            self.meta.append({"key": values.get("name") or values.get("property", ""), "content": values.get("content", "")})


def extract_reference_site(url: str, *, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "PinCommerce-DesignIntelligence/1.0"})
    with opener(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")
    parser = _ReferenceParser()
    parser.feed(html)
    colors = sorted(set(re.findall(r"#[0-9A-Fa-f]{6}\b", html)))
    payload = {
        "source_ref": url,
        "colors": {f"color_{i+1}": value for i, value in enumerate(colors[:50])},
        "assets": [{"type": "stylesheet", "ref": href} for href in parser.stylesheets],
        "notes": [f"meta:{m['key']}={m['content']}" for m in parser.meta[:50]],
    }
    return ingest("reference-site", url, payload)
