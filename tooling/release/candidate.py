from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from typing import Any

import yaml

from tooling.validation.identifiers import IdentifierError, validate_identifier

ROOT = Path(__file__).resolve().parents[2]


class CandidateError(RuntimeError):
    pass


def save_yaml(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(value, fh, sort_keys=False)


def create_candidate(
    *,
    client_id: str,
    source_revision: str,
    artifact_paths: list[Path],
    created_by: str,
    root: Path = ROOT,
) -> dict[str, Any]:
    try:
        validate_identifier(client_id, kind="client_id")
        validate_identifier(source_revision, kind="source_revision")
    except IdentifierError as exc:
        raise CandidateError(str(exc)) from exc

    digest = hashlib.sha256()
    components = []
    for path in sorted(artifact_paths, key=lambda p: str(p)):
        absolute = path if path.is_absolute() else root / path
        if not absolute.exists():
            raise CandidateError(f"Missing release artifact: {absolute}")
        data = absolute.read_bytes()
        file_digest = hashlib.sha256(data).hexdigest()
        digest.update(str(path).encode("utf-8"))
        digest.update(data)
        components.append({
            "path": str(path),
            "sha256": file_digest,
            "size": len(data),
        })

    candidate_id = f"RC-{client_id}-{source_revision[:12]}"
    return {
        "candidate_id": candidate_id,
        "client_id": client_id,
        "source_revision": source_revision,
        "artifact_digest": digest.hexdigest(),
        "environment": "staging",
        "created_by": created_by,
        "immutable": True,
        "status": "created",
        "components": components,
    }


def write_candidate(
    *,
    client_id: str,
    source_revision: str,
    artifact_paths: list[Path],
    created_by: str,
    root: Path = ROOT,
) -> Path:
    candidate = create_candidate(
        client_id=client_id,
        source_revision=source_revision,
        artifact_paths=artifact_paths,
        created_by=created_by,
        root=root,
    )
    path = (
        root
        / "client-projects"
        / client_id
        / "release"
        / "candidates"
        / f"{candidate['candidate_id']}.yaml"
    )
    if path.exists():
        raise CandidateError(f"Candidate already exists: {path}")
    save_yaml(path, candidate)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description="Create immutable release candidate")
    parser.add_argument("--client", required=True)
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--created-by", required=True)
    parser.add_argument("--artifact", action="append", required=True)
    args = parser.parse_args()

    try:
        path = write_candidate(
            client_id=args.client,
            source_revision=args.source_revision,
            created_by=args.created_by,
            artifact_paths=[Path(p) for p in args.artifact],
        )
        print(path.relative_to(ROOT))
        return 0
    except CandidateError as exc:
        print(f"candidate-error: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
