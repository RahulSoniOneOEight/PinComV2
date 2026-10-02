# ApnaKart (client102) — App Build Plan (Flutter marketplace)

**Created:** 2026-10-03
**Scope:** the **app** part only — the Flutter marketplace. Surfaces `customer-app` and `b2b`.
**Derived from:** `derived/journey-flow-gaps.md` (gap analysis, commit cf11cf0) against
`C:\Users\LENOVO\Desktop\BuildKart-B2C-B2B-Journey-Guide.md`
**Excludes:** the desktop/web rebuild (seller-portal, commerce-admin, erp, ops-console,
analytics, web-store, superadmin) — that continues separately as `W*` artboards.

## Platform rule (client-stated)

- **Flutter = the marketplace only** → `customer-app`, `b2b`. Every screen in this plan is
  a **390×844** artboard (long-scroll where noted).
- Web surfaces are out of scope here; `W*` artboards use the 1440 layout instead.

## Conventions (non-negotiable)

- Palette `stormy-morning` token values only — no new raw colours. New colour pairs must pass
  `theme_compiler` / `contrast_audit` at 4.5:1 text, 3:1 non-text.
- Font **Hind**; sizes 11 / 12 / 14 / 16 / 20; weights 400 / 600 / 700; CTAs 48px tall.
- Radius 4 / 8 / 12 / 999. Touch targets ≥ 44px.
- Every data-backed screen ships **default, loading, empty, error, success** states.
- One screen per `execute` step; capture and *look* at the render before moving on.
- Screens are referenced **by name, never by node id** — OpenPencil reassigns ids on save.

## Wave 1 — entry, auth and discovery (8 screens)

Fills B2C-00 (partial), B2C-02 (partial), B2C-03 (partial), B2B-00 (missing).

| ID | Screen | Surface | Journey nodes | Core components | Key states |
|---|---|---|---|---|---|
| S36 | Sign Up | customer-app | new `consumer-auth.2` | `input.text-field` ×4, `action.button`, `navigation.app-bar` | empty, validation, submitting, failure, success |
| S37 | Browse | customer-app | new `browse-category.1` | `navigation.category-item` grid (3-col), `commerce.search-bar`, `navigation.bottom-nav-item` | loading, list, empty, error |
| S38 | Category results | customer-app | new `browse-category.2` | `commerce.product-card` grid 2-up, `control.filter-chip`, sort control, `feedback.empty-state` | loading, results, no results, error |
| S39 | Filters | customer-app | new `search-to-buy.1b` | `control.filter-chip` groups ×3, price range, sticky Apply, reset | default, selected, applied |
| S40 | Verify OTP | b2b | new `trade-auth.2` | OTP input ×6, resend countdown, `action.button` | entry, countdown, invalid, verifying, success |
| S41 | Saved addresses | customer-app | new `consumer-account.3` | address cards, default badge, add/edit actions | list, empty, loading, error |
| S42 | Payment methods | customer-app | new `consumer-account.4` | payment cards, default badge, add action | list, empty, error |
| S43 | Help | customer-app | new `consumer-account.7` | FAQ rows, contact rows, search | default, empty |

**Wave 1 also adds the two missing journey families** — `consumer-auth` (B2C-00) and
`trade-auth` (B2B-00) — to `journey-graph.yaml`, plus `browse-category` and
`consumer-account`. Without them these screens have no governed journey to hang from.

## Wave 2 — consumer self-service and returns (7 screens)

Fills B2C-04 (partial), B2C-06 (missing), B2C-07 (partial).

| ID | Screen | Surface | Journey nodes | Core components | Key states |
|---|---|---|---|---|---|
| S44 | GST & invoices (B2C) | customer-app | new `consumer-account.5` | invoice rows, download action | list, empty, download pending/failed |
| S45 | Settings | customer-app | new `consumer-account.8` | toggle rows, language, theme, delete account | default, confirm |
| S46 | Request return | customer-app | `return-refund.2` refine | order summary, reason select, item select, submit | eligible, ineligible, selected, submitting, failure |
| S47 | Return status | customer-app | `return-refund.3` split | status timeline, seller review state, approved/rejected | submitted, in review, approved, rejected |
| S48 | Refund tracking | customer-app | `return-refund.4` split | refund timeline, amount, method, pickup status | pickup pending, refund pending, refunded |
| S49 | Wishlist → cart confirm | customer-app | new `wishlist-to-cart.2` | saved cards, qty, add-to-cart | populated, empty, add success/failure |
| S50 | Order detail | customer-app | new `order-tracking.1b` | order summary, items, invoice, Track, Return | loading, default, error |

**Note:** `return-refund.3` and `.4` currently both map to S26 · Orders Returned. S47/S48
split them so review and refund are separately realisable — this is the flow break called
out in the gap analysis.

## Wave 3 — B2B buying completion (7 screens)

Fills B2B-01, B2B-02, B2B-03, B2B-04, B2B-05 (all missing/partial).

| ID | Screen | Surface | Journey nodes | Core components | Key states |
|---|---|---|---|---|---|
| S51 | Business checkout | b2b | `repeat-order.3`, `quote-to-order.4b`, new `trade-direct-order.4` | delivery/site block, payment/credit select, totals, Place Business Order | validation, approval-required, submitting, failure |
| S52 | Order confirmed (B2B) | b2b | new `trade-direct-order.5` | PO reference, totals, GST-invoice action | confirmed, invoice available/pending |
| S53 | Quick order search results | b2b | new `quick-order.2` | SKU result rows (name, SKU, price, direct +), search field | loading, results, no matches, added |
| S54 | Quick order centre | b2b | new `procurement.2` | segmented Manual/Upload, upload CTA, saved + suggested list cards | manual/upload tab, upload pending/success/failure |
| S55 | Procurement list detail | b2b | new `procurement.3` | source meta, selectable item rows, qty steppers, Add Selected / Add All sticky | not found, selected, qty changed, none selected, add success/failure |
| S56 | Catalogue | b2b | new `catalogue-direct.1` | search, category chips, `commerce.product-card` trade variant grid | loading, filtered, no matches, out of stock |
| S57 | Accept quote | b2b | `quote-to-order.3b` | seller summary, totals, GST/delivery/validity, Convert to Order | review, accepting, failure, accepted |

**This wave fixes the `quote-to-order` overload** (Compare ≠ Accept, Cart ≠ Checkout, and
the consumer S21 no longer doubles as the B2B confirmation) and gives `repeat-order` a real
checkout + confirmation after the cart.

## Wave 4 — B2B projects, post-order and administration (11 screens)

Fills B2B-07 (partial), B2B-08, B2B-09, B2B-10, B2B-11.

| ID | Screen | Surface | Journey nodes | Core components | Key states |
|---|---|---|---|---|---|
| S58 | Approvals | b2b | `credit-order.2` real | approval cards, amount, status, approve/reject | pending, approved, rejected, escalated |
| S59 | GST invoices (B2B) | b2b | new `b2b-invoices.1` | invoice rows, totals, Download All | loading, list, empty, download failure |
| S60 | Projects & sites | b2b | new `project-purchase.1` | project cards, location meta, New Project | list, empty, loading, failure |
| S61 | Project detail | b2b | new `project-purchase.2` | summary + tabs (Material Lists/Orders/Sites/RFQs) | default tab, empty section, loading |
| S62 | Material list | b2b | new `project-purchase.3` | material rows, qty/price, Add to Quotation Cart | editable, unavailable, add success/failure |
| S63 | Site selector | b2b | new `project-purchase.5` | site radio cards, Confirm Site | none, selected, validation |
| S64 | Split tracking | b2b | new `b2b-tracking.1` | seller shipment cards, AWB, status badges | partial dispatch, in transit, delivered, exception |
| S65 | Buyer-seller chat | b2b | new `b2b-chat.1` | header, message bubbles, composer | loading, conversation, sending, failed |
| S66 | Business account | b2b | new `business-admin.1` | identity/GSTIN card, menu tiles, mode switch | default |
| S67 | Team & roles | b2b | new `business-admin.2` | member rows, role labels, Invite, Edit | list, invitation, editing, failure |
| S68 | Price advantage | b2b | new `schemes.2` | account summary, savings headline, tier table | eligible, no advantage, loading |

## New components required (app side)

Absent from both the registry and the IR; needed by the screens above:

`commerce.checkout-summary`, `form.section`, `commerce.quick-order-sku-card` (canvas-only today),
`b2b.procurement-filter-bar` (canvas-only), `commerce.buy-again-card` (canvas-only),
`merchandising.tile` (canvas-only), `commerce.carousel`, `commerce.flash-deals-carousel`,
`marketing.secondary-banner`, `commerce.credit-metric-card`, `commerce.credit-action-card`,
`commerce.quote-card`, `commerce.quote-comparison`, `commerce.project-card`,
`commerce.material-row`, `commerce.site-card`, `chat.message`, `chat.composer`,
`commerce.team-member-row`, `navigation.container` (no container contract exists today).

Each needs a contract entry with platforms + states before its screen is built (house rule:
contracts before screens).

## Order of work

1. **Journeys first** — add the 14 missing families/nodes to `journey-graph.yaml`, add their
   `component_refs` and `state_refs` to `design-ir.yaml`, and extend `journey_node_map`.
2. **Contracts** — register the new components with platforms and the 5 states.
3. **Wave 1 → 2 → 3 → 4**, one screen per step, capture and inspect each.
4. Regenerate evidence (manifest → capture → VQA) after each wave, in that order.
5. Then resume the desktop/web surfaces (`W*`).

## Gate reality

- Integrity is currently **13 blockers**. Building these screens does **not** clear the
  visual-QA blockers — those need captures *and* human-reviewed checks
  (`asset-quality-and-source`, `critical-states`, `state-completeness`, …), which cannot be
  fabricated. Expect the blocker count to stay flat while the design work proceeds.
- `design-implementation-plan.yaml` stays `status: blocked`; this plan is design-side and
  does not unblock code generation.

## Not verifiable from the artifacts

Runtime behaviour, real data shapes, and responsive behaviour below 390px are out of scope
for a static design pass.
