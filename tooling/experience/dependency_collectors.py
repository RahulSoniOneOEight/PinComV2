from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Callable


class DependencyCollectorError(RuntimeError):
    pass


def _get_json(url: str, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "PinCommerce-DependencyCollector/1.0"})
    with opener(req, timeout=30) as response:
        value = json.loads(response.read().decode("utf-8"))
    if not isinstance(value, dict):
        raise DependencyCollectorError(f"Expected object from {url}")
    return value


def collect_npm(package: str, runtime: str, *, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    encoded = urllib.parse.quote(package, safe="")
    payload = _get_json(f"https://registry.npmjs.org/{encoded}", opener)
    latest = payload.get("dist-tags", {}).get("latest")
    version = payload.get("versions", {}).get(latest, {}) if latest else {}
    released = payload.get("time", {}).get(latest)
    license_id = version.get("license") or payload.get("license") or "unknown"
    return {
        "id": package,
        "ecosystem": "npm",
        "runtime": runtime,
        "version": latest,
        "last_release_at": released,
        "license": license_id,
        "framework_compatibility": version.get("peerDependencies", {}),
        "vulnerabilities": [],
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }


def collect_pub(package: str, runtime: str, *, opener: Callable[..., Any] = urllib.request.urlopen) -> dict[str, Any]:
    payload = _get_json(f"https://pub.dev/api/packages/{urllib.parse.quote(package)}", opener)
    latest = payload.get("latest", {})
    pubspec = latest.get("pubspec", {})
    archive = latest.get("archive_url", "")
    released = latest.get("published")
    return {
        "id": package,
        "ecosystem": "pub",
        "runtime": runtime,
        "version": latest.get("version"),
        "last_release_at": released,
        "license": pubspec.get("license") or "unknown",
        "framework_compatibility": {"environment": pubspec.get("environment", {}), "archive": archive},
        "vulnerabilities": [],
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }


def collect_sources(rows: list[dict[str, Any]], *, opener: Callable[..., Any] = urllib.request.urlopen) -> list[dict[str, Any]]:
    result = []
    for row in rows:
        ecosystem = row.get("ecosystem")
        package = str(row.get("package"))
        runtime = str(row.get("runtime"))
        if ecosystem == "npm":
            item = collect_npm(package, runtime, opener=opener)
        elif ecosystem == "pub":
            item = collect_pub(package, runtime, opener=opener)
        else:
            raise DependencyCollectorError(f"Unsupported ecosystem: {ecosystem}")
        item["source_id"] = row.get("id")
        result.append(item)
    return result
