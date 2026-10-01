"""Deprecated compatibility shim.

Penpot automation has been rebuilt for OpenPencil. Import from
:mod:`tooling.experience.openpencil_automation` instead. This module is retained
so existing imports keep working during the migration.
"""

from __future__ import annotations

from tooling.experience.openpencil_automation import (  # noqa: F401
    DEFAULT_BIN,
    ROOT,
    OpenPencilAutomationError,
    PenpotAutomationError,
    build_operations,
    observe,
    observe_and_record,
)

__all__ = [
    "DEFAULT_BIN",
    "ROOT",
    "OpenPencilAutomationError",
    "PenpotAutomationError",
    "build_operations",
    "observe",
    "observe_and_record",
]
