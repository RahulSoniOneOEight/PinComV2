from __future__ import annotations

import os
import re

IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
MAX_LENGTH = 128


class IdentifierError(ValueError):
    pass


def validate_identifier(
    value: str,
    *,
    kind: str = "identifier",
    max_length: int = MAX_LENGTH,
) -> str:
    """Validate a user-supplied identifier that will be joined into a filesystem path.

    Accepts reasonable ids such as ``reference-retail``, ``client_101`` and
    ``abc.1``. Rejects path traversal (``../x``, ``../../``), absolute paths,
    path separators, and other unsafe characters.
    """
    if not isinstance(value, str) or not value:
        raise IdentifierError(f"{kind} must be a non-empty string")
    if len(value) > max_length:
        raise IdentifierError(f"{kind} exceeds {max_length} characters")
    if value in {".", ".."}:
        raise IdentifierError(f"{kind} must not be a path segment")
    if "/" in value or "\\" in value:
        raise IdentifierError(f"{kind} must not contain path separators: {value!r}")
    if os.path.isabs(value):
        raise IdentifierError(f"{kind} must not be an absolute path: {value!r}")
    if ".." in value:
        raise IdentifierError(f"{kind} must not contain '..': {value!r}")
    if not IDENTIFIER_PATTERN.match(value):
        raise IdentifierError(f"{kind} contains invalid characters: {value!r}")
    return value


def is_safe_identifier(value: str) -> bool:
    try:
        validate_identifier(value)
    except IdentifierError:
        return False
    return True
