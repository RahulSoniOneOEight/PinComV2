from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from tooling.contracts.validator import validate, validate_document
from tooling.validation.identifiers import IdentifierError, validate_identifier

ROOT = Path(__file__).resolve().parents[2]


class ProposalError(RuntimeError):
    pass


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ProposalError(f"Proposal does not exist: {path}")
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ProposalError(f"Expected mapping in {path}")
    return data


def save_yaml(path: Path, data: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(data, fh, sort_keys=False)


def proposal_path(client_id: str, filename: str, root: Path = ROOT) -> Path:
    try:
        validate_identifier(client_id, kind="client_id")
        validate_identifier(filename, kind="proposal filename")
    except IdentifierError as exc:
        raise ProposalError(str(exc)) from exc
    return root / "client-projects" / client_id / "intelligence" / "ai" / filename


def audit_path(client_id: str, root: Path = ROOT) -> Path:
    try:
        validate_identifier(client_id, kind="client_id")
    except IdentifierError as exc:
        raise ProposalError(str(exc)) from exc
    return root / "client-projects" / client_id / "intelligence" / "ai" / "model-runs.jsonl"


def append_audit(client_id: str, event: dict[str, Any], root: Path = ROOT) -> None:
    path = audit_path(client_id, root)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"timestamp": datetime.now(timezone.utc).isoformat(), **event}
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, sort_keys=True) + "\n")


def validate_proposal(path: Path) -> list[str]:
    return validate(path, "ai-proposal")


def review(
    client_id: str,
    filename: str,
    reviewer: str,
    decision: str,
    notes: list[str],
    root: Path = ROOT,
) -> dict[str, Any]:
    if decision not in {"approved", "rejected", "modified"}:
        raise ProposalError("Decision must be approved, rejected, or modified")

    path = proposal_path(client_id, filename, root)
    proposal = load_yaml(path)

    if root == ROOT:
        errors = validate_proposal(path)
        if errors:
            raise ProposalError("Invalid proposal: " + "; ".join(errors))

    proposal.setdefault("human_review", {})
    proposal["human_review"] = {
        "status": decision,
        "reviewer": reviewer,
        "notes": notes,
    }
    proposal["status"] = "approved" if decision in {"approved", "modified"} else "rejected"
    save_yaml(path, proposal)

    append_audit(
        client_id,
        {
            "event": "ai.proposal.reviewed",
            "proposal_id": proposal.get("proposal_id"),
            "task": proposal.get("task"),
            "provider": proposal.get("provider"),
            "model_role": proposal.get("model_role"),
            "reviewer": reviewer,
            "decision": decision,
        },
        root,
    )
    return proposal


def promote(
    client_id: str,
    filename: str,
    *,
    target: str,
    promoted_by: str | None,
    notes: list[str] | None = None,
    root: Path = ROOT,
) -> dict[str, Any]:
    """Promote a human-approved AI proposal into the governed decisions ledger.

    This is a gate, not an automatic write into governed truth: it requires an
    explicit human promoter and an approved/modified human review, validates the
    proposal and the decision record against their schemas, and records audit
    evidence. It never writes to ``derived/*`` or ``solution/*``.
    """
    if not promoted_by:
        raise ProposalError("Promotion requires an explicit human promoter")

    try:
        validate_identifier(target, kind="promotion target")
    except IdentifierError as exc:
        raise ProposalError(str(exc)) from exc

    path = proposal_path(client_id, filename, root)
    proposal = load_yaml(path)

    if root == ROOT:
        errors = validate_proposal(path)
        if errors:
            raise ProposalError("Invalid proposal: " + "; ".join(errors))

    human_review = proposal.get("human_review") or {}
    decision_status = human_review.get("status")
    if decision_status not in {"approved", "modified"}:
        raise ProposalError(
            "Proposal must be approved or modified by a human before promotion"
        )
    reviewer = human_review.get("reviewer")
    if not reviewer:
        raise ProposalError("Proposal human review must name a reviewer")

    proposal_id = proposal.get("proposal_id")
    if not proposal_id:
        raise ProposalError("Proposal is missing proposal_id")

    decision = {
        "decision_id": f"DEC-{proposal_id}",
        "proposal_id": proposal_id,
        "client_id": client_id,
        "reviewer": reviewer,
        "decision": decision_status,
        "target": target,
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes or [],
    }

    if root == ROOT:
        errors = validate_document(decision, "ai-decision")
        if errors:
            raise ProposalError("Invalid decision record: " + "; ".join(errors))

    decisions_dir = root / "client-projects" / client_id / "intelligence" / "ai" / "decisions"
    decisions_dir.mkdir(parents=True, exist_ok=True)
    save_yaml(decisions_dir / f"{proposal_id}.yaml", decision)

    proposal["status"] = "promoted"
    save_yaml(path, proposal)

    append_audit(
        client_id,
        {
            "event": "ai.proposal.promoted",
            "proposal_id": proposal_id,
            "target": target,
            "promoted_by": promoted_by,
            "reviewer": reviewer,
            "decision": decision_status,
        },
        root,
    )
    return decision


def command_validate(args: argparse.Namespace) -> int:
    path = proposal_path(args.client, args.file)
    errors = validate_proposal(path)
    if errors:
        print(f"{path}: invalid AI proposal")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"{path}: valid AI proposal")
    return 0


def command_review(args: argparse.Namespace) -> int:
    review(
        args.client,
        args.file,
        reviewer=args.reviewer,
        decision=args.decision,
        notes=args.note,
    )
    print(f"Reviewed {args.file}: {args.decision}")
    return 0


def command_promote(args: argparse.Namespace) -> int:
    decision = promote(
        args.client,
        args.file,
        target=args.target,
        promoted_by=args.promoted_by,
        notes=args.note,
    )
    print(f"Promoted {decision['proposal_id']} -> {decision['target']}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage governed AI proposals")
    sub = parser.add_subparsers(dest="command", required=True)

    val = sub.add_parser("validate")
    val.add_argument("--client", required=True)
    val.add_argument("--file", required=True)
    val.set_defaults(func=command_validate)

    rev = sub.add_parser("review")
    rev.add_argument("--client", required=True)
    rev.add_argument("--file", required=True)
    rev.add_argument("--reviewer", required=True)
    rev.add_argument("--decision", choices=["approved", "rejected", "modified"], required=True)
    rev.add_argument("--note", action="append", default=[])
    rev.set_defaults(func=command_review)

    pro = sub.add_parser("promote")
    pro.add_argument("--client", required=True)
    pro.add_argument("--file", required=True)
    pro.add_argument("--target", required=True)
    pro.add_argument("--promoted-by", required=True)
    pro.add_argument("--note", action="append", default=[])
    pro.set_defaults(func=command_promote)

    args = parser.parse_args()
    try:
        return args.func(args)
    except ProposalError as exc:
        print(f"proposal-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
