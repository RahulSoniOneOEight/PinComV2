from __future__ import annotations

import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

from tooling.integration.adapters import ProviderConfig


def check_provider(
    config: ProviderConfig,
    health_path: str,
) -> dict[str, Any]:
    url = config.base_url.rstrip("/") + health_path
    start = time.perf_counter()
    try:
        request = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(request, timeout=config.timeout_seconds) as response:
            latency_ms = (time.perf_counter() - start) * 1000
            return {
                "provider": config.provider,
                "status": "healthy" if 200 <= response.status < 300 else "degraded",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "latency_ms": round(latency_ms, 2),
                "details": {"status_code": response.status},
            }
    except (urllib.error.HTTPError, urllib.error.URLError) as exc:
        latency_ms = (time.perf_counter() - start) * 1000
        return {
            "provider": config.provider,
            "status": "unreachable",
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "latency_ms": round(latency_ms, 2),
            "details": {"error": str(exc)},
        }
