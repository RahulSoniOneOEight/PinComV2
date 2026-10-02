# OpenPencil page scoping in v0.15.1

Observed on 2026-10-02 against `client-projects/client102/experience/design/apnakart-design.fig` and the same document open in the desktop app as `tab-2`.

## Rule

1. MCP `find_nodes` calls `currentPage.findAll`, so it is recursive within one page, not top-level-only and not document-wide.
2. With no target, MCP uses the desktop tab's actual active page. Supplying both `document_id` and `page_id` reliably creates a page-scoped operation context. Use both on every MCP read and write.
3. MCP `switch_page` changes only the operation's temporary API context in v0.15.1. It returns the requested page but a following call sees the desktop tab's original page. Do not use it as page-selection state.
4. CLI file mode searches all pages by default. Add `--page "<exact page name>"` to scope a saved file. Always add `--limit 10000` because `find` otherwise truncates at 100.
5. Connected CLI `--page-id` is not a workaround: it returned all frames for each tested page ID.
6. `export_image` is stricter than other targeted MCP tools. An inactive-page node still fails with `Raster export selection must stay on a single page`, even with `page_id`. Activate the page in the desktop UI before raster export.

## Minimal reproduction

Before the ApnaKart reorganisation, the desktop tab's actual page was `0:24`:

| Operation | `0:4` | `0:24` | `0:25` | `0:3491` |
| --- | ---: | ---: | ---: | ---: |
| MCP `find_nodes({type:"FRAME"})` after `switch_page` | 779 | 779 | 779 | 779 |
| MCP `find_nodes({type:"FRAME", document_id:"tab-2", page_id})` | 975 | 779 | 0 | 0 |
| MCP screen-name matches with explicit target | 18 | 18 | 0 | 0 |

`switch_page` reported the requested ID each time, but `get_current_page({document_id:"tab-2"})` remained `0:24`. By contrast, `get_current_page({document_id:"tab-2", page_id:"0:4"})` returned `0:4`, confirming that explicit targeting works for the operation without changing desktop state.

The saved desktop file contained 1,754 frames (`975 + 779`), while the stale repo copy contained 1,759. A multiset diff located the five repo-only frames inside the taller repo version of `zz-p3-decoration`: `skBody`, `skLine1`, `skLine2`, `skLine3`, and `skBtn`. Thus the apparent 779-versus-1,759 contradiction combined three facts: MCP was searching one page, CLI file mode was searching all pages, and the two files were different revisions. `save_file({document_id:"tab-2"})` did flush the live graph: the saved file then reported the same 1,703-frame total as the explicit MCP page counts (`198 + 1432 + 0 + 73`).

## Safe per-page workflow

1. Discover `document_id` and page IDs with `list_documents`.
2. Back up the on-disk file before bulk mutation.
3. Pass `document_id` and `page_id` to every MCP read/write; prove the target on one node and compare page counts.
4. Use parent page IDs with `reparent_node` for cross-page moves; verify with `node_ancestors`, explicit per-page counts, and `get_page_tree`.
5. Activate the destination page in the desktop UI for `export_image`, export PNG, and inspect it.
6. Call `save_file`, then validate the saved revision with CLI file mode and explicit `--page` filters.
7. Copy the validated desktop file to the governed repo path and compare SHA-256 hashes.

## Defect boundary

The installed core implementation (`@open-pencil/core/src/tools/read/pages.ts`) assigns `figma.currentPage` inside the `switch_page` tool. The next MCP request receives a fresh page-targeted API context, so that assignment is not persisted to desktop editor state. A product fix needs `switch_page` to invoke the editor's persistent page-switch command (or the MCP contract must explicitly define it as request-local). The connected CLI must also forward `--page-id` when executing `find`, and raster export must honor the targeted page or reject `page_id` as unsupported.
