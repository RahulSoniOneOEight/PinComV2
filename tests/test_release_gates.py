from pathlib import Path
import tempfile
import unittest
import yaml

from tooling.release.candidate import create_candidate
from tooling.release.gates import GateError, verify_release_readiness
from tooling.release.hardening import build_hardening_evidence
from tooling.release.recovery import make_recovery_record
from tooling.observability.runtime import TelemetryBuffer


class ReleaseGateTests(unittest.TestCase):
    def test_candidate_digest_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            artifact = root / "artifact.txt"
            artifact.write_text("release-artifact", encoding="utf-8")

            first = create_candidate(
                client_id="demo",
                source_revision="abcdef1234567890",
                artifact_paths=[Path("artifact.txt")],
                created_by="tester",
                root=root,
            )
            second = create_candidate(
                client_id="demo",
                source_revision="abcdef1234567890",
                artifact_paths=[Path("artifact.txt")],
                created_by="tester",
                root=root,
            )
            self.assertEqual(first["artifact_digest"], second["artifact_digest"])
            self.assertTrue(first["immutable"])

    def test_hardening_blocks_not_run_checks(self):
        evidence = build_hardening_evidence(
            "RC-demo-1",
            {"contract-validation": ("pass", "ci")},
        )
        self.assertEqual(evidence["status"], "failed")

    def test_release_requires_exact_candidate_and_human_authorization(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            candidate = {
                "candidate_id": "RC-demo-1",
                "client_id": "demo",
                "source_revision": "abc",
                "artifact_digest": "digest",
                "environment": "staging",
                "created_by": "builder",
                "immutable": True,
                "status": "uat-passed",
            }
            hardening = {
                "evidence_id": "HARD-1",
                "candidate_id": "RC-demo-1",
                "checks": [],
                "status": "passed",
            }
            uat = {
                "uat_id": "UAT-1",
                "client_id": "demo",
                "candidate_id": "RC-demo-1",
                "scenarios": [],
                "approved_by": "uat-owner",
                "status": "passed",
            }
            auth = {
                "authorization_id": "AUTH-1",
                "client_id": "demo",
                "candidate_id": "RC-demo-1",
                "authorized_by": "release-owner",
                "decision": "approved",
                "authorized_at": "2026-09-19T00:00:00Z",
            }

            paths = {}
            for name, value in {
                "candidate": candidate,
                "hardening": hardening,
                "uat": uat,
                "auth": auth,
            }.items():
                path = root / f"{name}.yaml"
                path.write_text(yaml.safe_dump(value), encoding="utf-8")
                paths[name] = path

            result = verify_release_readiness(
                candidate_path=paths["candidate"],
                hardening_path=paths["hardening"],
                uat_path=paths["uat"],
                authorization_path=paths["auth"],
            )
            self.assertTrue(result["ready"])
            self.assertEqual(result["authorized_by"], "release-owner")

            auth["candidate_id"] = "RC-other"
            paths["auth"].write_text(yaml.safe_dump(auth), encoding="utf-8")
            with self.assertRaises(GateError):
                verify_release_readiness(
                    candidate_path=paths["candidate"],
                    hardening_path=paths["hardening"],
                    uat_path=paths["uat"],
                    authorization_path=paths["auth"],
                )

    def test_recovery_plan(self):
        record = make_recovery_record(
            recovery_id="REC-1",
            release_id="REL-1",
            reason="smoke failure",
            action="rollback",
            target_candidate_id="RC-previous",
        )
        self.assertEqual(record["status"], "planned")
        self.assertEqual(record["action"], "rollback")

    def test_observability_buffer(self):
        telemetry = TelemetryBuffer()
        telemetry.metric("http.latency", ms=25)
        telemetry.trace("order.to.erp", correlation_id="corr-1")
        telemetry.error("provider.failure", provider="tryton")
        snapshot = telemetry.snapshot()
        self.assertEqual(len(snapshot), 3)
        self.assertEqual(snapshot[1]["kind"], "trace")


if __name__ == "__main__":
    unittest.main()
