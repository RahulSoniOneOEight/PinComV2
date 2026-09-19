from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from tooling.validation.identifiers import IdentifierError, validate_identifier

ROOT = Path(__file__).resolve().parents[2]
LIFECYCLE_PATH = ROOT / "workflows" / "lifecycle.yaml"


class WorkflowError(RuntimeError):
    pass


@dataclass(frozen=True)
class Stage:
    id: str
    output: str
    human_gate: bool = False


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise WorkflowError(f"Missing workflow artifact: {path}")
    with path.open("r", encoding="utf-8") as fh:
        value = yaml.safe_load(fh)
    if not isinstance(value, dict):
        raise WorkflowError(f"Expected mapping in {path}")
    return value


def save_yaml(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(value, fh, sort_keys=False)


def lifecycle(path: Path = LIFECYCLE_PATH) -> list[Stage]:
    data = load_yaml(path)
    stages = data.get("stages", [])
    if not isinstance(stages, list) or not stages:
        raise WorkflowError("Lifecycle must define at least one stage")
    return [
        Stage(
            id=item["id"],
            output=item["output"],
            human_gate=bool(item.get("human_gate", False)),
        )
        for item in stages
    ]


def project_root(client_id: str, root: Path = ROOT) -> Path:
    try:
        validate_identifier(client_id, kind="client_id")
    except IdentifierError as exc:
        raise WorkflowError(str(exc)) from exc
    return root / "client-projects" / client_id


def workflow_state_path(client_id: str, root: Path = ROOT) -> Path:
    return project_root(client_id, root) / "workflow" / "workflow-state.yaml"


def audit_path(client_id: str, root: Path = ROOT) -> Path:
    return project_root(client_id, root) / "workflow" / "audit.jsonl"


def load_state(client_id: str, root: Path = ROOT) -> dict[str, Any]:
    return load_yaml(workflow_state_path(client_id, root))


def stage_index(stage_id: str, stages: list[Stage]) -> int:
    for i, stage in enumerate(stages):
        if stage.id == stage_id:
            return i
    raise WorkflowError(f"Unknown workflow stage: {stage_id}")


def output_exists(client_id: str, stage: Stage, root: Path = ROOT) -> bool:
    return (project_root(client_id, root) / stage.output).exists()


def append_audit(client_id: str, event: dict[str, Any], root: Path = ROOT) -> None:
    path = audit_path(client_id, root)
    path.parent.mkdir(parents=True, exist_ok=True)
    enriched = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **event,
    }
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(enriched, sort_keys=True) + "\n")


def validate_state(client_id: str, root: Path = ROOT) -> list[str]:
    stages = lifecycle(root / "workflows" / "lifecycle.yaml")
    state = load_state(client_id, root)
    errors: list[str] = []

    current = state.get("current_stage")
    completed = state.get("completed", [])
    approvals = state.get("human_approvals", [])

    try:
        current_idx = stage_index(current, stages)
    except WorkflowError as exc:
        return [str(exc)]

    if not isinstance(completed, list):
        errors.append("completed must be a list")
        completed = []
    if not isinstance(approvals, list):
        errors.append("human_approvals must be a list")
        approvals = []

    for stage_id in completed:
        try:
            idx = stage_index(stage_id, stages)
        except WorkflowError as exc:
            errors.append(str(exc))
            continue
        if idx >= current_idx:
            errors.append(
                f"Completed stage {stage_id} cannot be current/future relative to {current}"
            )

    for stage in stages[:current_idx]:
        if stage.id not in completed:
            errors.append(f"Missing completed stage before current stage: {stage.id}")
        if not output_exists(client_id, stage, root):
            errors.append(f"Missing required output for {stage.id}: {stage.output}")
        if stage.human_gate and stage.id not in approvals:
            errors.append(f"Missing human approval for completed gate: {stage.id}")

    return errors


def advance(
    client_id: str,
    actor: str,
    root: Path = ROOT,
    approve_current_gate: bool = False,
) -> dict[str, Any]:
    stages = lifecycle(root / "workflows" / "lifecycle.yaml")
    state_path = workflow_state_path(client_id, root)
    state = load_state(client_id, root)

    if state.get("blocked"):
        raise WorkflowError("Workflow is blocked; resolve blocker before advancing")

    current_id = state["current_stage"]
    idx = stage_index(current_id, stages)
    current = stages[idx]

    if not output_exists(client_id, current, root):
        raise WorkflowError(
            f"Cannot complete {current.id}; required output missing: {current.output}"
        )

    approvals = list(state.get("human_approvals", []))
    if current.human_gate:
        if approve_current_gate and current.id not in approvals:
            approvals.append(current.id)
        if current.id not in approvals:
            raise WorkflowError(
                f"Stage {current.id} requires explicit human approval before advance"
            )

    if idx == len(stages) - 1:
        raise WorkflowError("Workflow is already at the final stage")

    completed = list(state.get("completed", []))
    if current.id not in completed:
        completed.append(current.id)

    next_stage = stages[idx + 1]
    state["completed"] = completed
    state["human_approvals"] = approvals
    state["current_stage"] = next_stage.id
    save_yaml(state_path, state)

    append_audit(
        client_id,
        {
            "event": "workflow.advance",
            "actor": actor,
            "from": current.id,
            "to": next_stage.id,
            "human_gate_approved": bool(current.human_gate),
        },
        root,
    )
    return state


def command_status(args: argparse.Namespace) -> int:
    state = load_state(args.client)
    errors = validate_state(args.client)
    print(yaml.safe_dump(state, sort_keys=False).strip())
    if errors:
        print("\nValidation errors:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("\nWorkflow state valid.")
    return 0


def command_advance(args: argparse.Namespace) -> int:
    state = advance(
        args.client,
        actor=args.actor,
        approve_current_gate=args.approve,
    )
    print(yaml.safe_dump(state, sort_keys=False).strip())
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Agency Platform V2 workflow runtime")
    sub = parser.add_subparsers(dest="command", required=True)

    status = sub.add_parser("status")
    status.add_argument("--client", required=True)
    status.set_defaults(func=command_status)

    adv = sub.add_parser("advance")
    adv.add_argument("--client", required=True)
    adv.add_argument("--actor", required=True)
    adv.add_argument("--approve", action="store_true")
    adv.set_defaults(func=command_advance)

    args = parser.parse_args()
    try:
        return args.func(args)
    except WorkflowError as exc:
        print(f"workflow-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
