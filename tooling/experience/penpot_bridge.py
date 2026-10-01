"""Deprecated compatibility shim.

The Penpot bridge has been rebuilt for OpenPencil. Import from
:mod:`tooling.experience.openpencil_bridge` instead. This module is retained so
existing imports keep working during the migration.
"""

from __future__ import annotations

from tooling.experience.openpencil_bridge import (  # noqa: F401
    MANIFEST_NAMES,
    OBSERVED_NAMES,
    OPENPENCIL_MANIFEST,
    OPENPENCIL_OBSERVED,
    PROVIDER_LEGACY,
    PROVIDER_OPENPENCIL,
    ROOT,
    OpenPencilBridgeError,
    PenpotBridgeError,
    build_manifest,
    design_evidence_paths,
    file_revision_ref,
    resolve_design_ref,
    verify_manifest,
)

__all__ = [
    "MANIFEST_NAMES",
    "OBSERVED_NAMES",
    "OPENPENCIL_MANIFEST",
    "OPENPENCIL_OBSERVED",
    "PROVIDER_LEGACY",
    "PROVIDER_OPENPENCIL",
    "ROOT",
    "OpenPencilBridgeError",
    "PenpotBridgeError",
    "build_manifest",
    "design_evidence_paths",
    "file_revision_ref",
    "resolve_design_ref",
    "verify_manifest",
]
