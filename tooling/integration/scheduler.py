from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Any


@dataclass(frozen=True)
class ReconciliationJob:
    job_id: str
    flow: str
    interval_minutes: int
    enabled: bool = True


class ReconciliationScheduler:
    def __init__(self) -> None:
        self.jobs: dict[str, ReconciliationJob] = {}

    def register(self, job: ReconciliationJob) -> None:
        self.jobs[job.job_id] = job

    def run_enabled(
        self,
        runner: Callable[[ReconciliationJob], Any],
    ) -> list[dict[str, Any]]:
        results = []
        for job in self.jobs.values():
            if not job.enabled:
                continue
            value = runner(job)
            results.append({
                "job_id": job.job_id,
                "flow": job.flow,
                "ran_at": datetime.now(timezone.utc).isoformat(),
                "result": value,
            })
        return results
