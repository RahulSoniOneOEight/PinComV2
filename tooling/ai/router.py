from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
ROUTING_PATH = ROOT / ".opencode" / "ai-routing.yaml"


class RoutingError(RuntimeError):
    pass


def load_routing(path: Path = ROUTING_PATH) -> dict[str, Any]:
    if not path.exists():
        raise RoutingError(f"Missing AI routing config: {path}")
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict) or "roles" not in data:
        raise RoutingError("AI routing config must contain roles")
    return data


def resolve_role(role: str, path: Path = ROUTING_PATH) -> dict[str, Any]:
    data = load_routing(path)
    roles = data["roles"]
    if role not in roles:
        raise RoutingError(f"Unknown AI role: {role}")
    config = dict(roles[role])
    config["role"] = role
    return config


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve OpenCode AI model role")
    parser.add_argument("--role", required=True)
    parser.add_argument("--config", type=Path, default=ROUTING_PATH)
    args = parser.parse_args()

    try:
        config = resolve_role(args.role, args.config)
        print(yaml.safe_dump(config, sort_keys=False).strip())
        return 0
    except RoutingError as exc:
        print(f"routing-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
