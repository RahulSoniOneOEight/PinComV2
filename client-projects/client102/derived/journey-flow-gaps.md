# ApnaKart (client102) — Journey → Screen → Component Gap Analysis

**Generated:** 2026-10-03
**Reference:** `C:\Users\LENOVO\Desktop\BuildKart-B2C-B2B-Journey-Guide.md` (client101 / BuildKart, 20 journeys)
**Analysed by:** GPT-5.6 Sol flow review, independently verified against the artifacts (counts below re-derived, not taken on trust)
**Status:** analysis only — no canvas changes proposed by this file

## Platform constraint (client-stated)

- **Flutter app = the marketplace only** → surfaces `customer-app`, `b2b`.
- **Web** → `commerce-admin` (commerce backend), `erp` (Tryton), `ops-console`, `analytics`,
  `seller-portal`, `web-store`.
- **`superadmin` is web** — and is **not declared anywhere** in the current surface list.

## Verified baseline

| Artifact | Verified value |
|---|---|
| Top-level artboards in `apnakart-design.fig` | **40** |
| `design-brief.yaml` `screen_map` entries | **25** |
| `design-brief.yaml` `journey_node_map` entries | **25** (covering only **16** distinct screens) |
| `component-contract-registry.yaml` contracts | **33** (flutter 30, web 29) |
| `design-ir.yaml` journeys / nodes | **13 / 51** |
| `design-ir.yaml` component list | **23** |
| Nodes by surface | customer-app 17, b2b 12, seller-portal 15, commerce-admin 3, erp 4 |
| Nodes for `web-store` / `analytics` / `ops-console` | **0 / 0 / 0** |
| Artboard sizes | **all 37 viewport artboards are 390×844** (+ 3 long-scroll at 390×2133/2148) |

Journey families present: browse-to-buy (.1–.6), search-to-buy (.1–.5), order-tracking (.1–.2),
return-refund (.1–.4), quote-to-order (.1–.5), repeat-order (.1–.3), credit-order (.1–.4),
seller-onboarding (.1–.4), seller-catalogue (.1–.4), marketplace-order (.1–.3),
seller-fulfilment (.1–.4), seller-return (.1–.3), seller-settlement (.1–.4).

---

## 1. Coverage against the 20 guide journeys

| Guide journey | Status | ApnaKart family | Gap |
|---|---|---|---|
| B2C-00 Onboarding & auth | **missing** | none | S1/S2 exist but no auth family; Sign Up absent |
| B2C-01 Home discovery & quick-add | partial | browse-to-buy | `.3 add-cart` maps to Product Variant, not Cart; no quick-add branch |
| B2C-02 Category browse | partial | browse-to-buy | No Browse / Category Results screen governed |
| B2C-03 Search & filter | partial | search-to-buy | No filter step; S6 Search results absent from `screen_map` |
| B2C-04 Wishlist to cart | **missing** | none | S33/S34 exist but no family references them |
| B2C-05 Order history & tracking | covered | order-tracking | — |
| B2C-06 Account & self-service | **missing** | none | Addresses / Payments / Invoices / Help / Settings absent |
| B2C-07 Return & refund | partial | return-refund | Review + refund-track both map to S26; no distinct states |
| B2B-00 Trade auth & entry | **missing** | none | No OTP screen or family |
| B2B-01 Trade Home direct order | **missing** | none | No direct-order family |
| B2B-02 Quick Order search | **missing** | none | S8L has the modules; no family |
| B2B-03 Procurement list | **missing** | none | S10 exists; no family or mapping |
| B2B-04 Catalogue / merchandising | **missing** | none | No catalogue family or screen |
| B2B-05 RFQ & quote-to-order | partial | quote-to-order | Compare doubles as Accept; Cart doubles as Checkout; no B2B confirmation |
| B2B-06 Repeat order | partial | repeat-order | Terminal checkout maps to Quotation Cart; no checkout/confirm node |
| B2B-07 Credit / payment / approval | partial | credit-order | 0 of 4 nodes mapped; no invoice or async-approval return |
| B2B-08 Project & site purchasing | **missing** | none | No projects / material-list / site-selector |
| B2B-09 Tracking, invoices, chat | **missing** | none | customer `order-tracking` does not satisfy B2B split tracking / invoices / chat |
| B2B-10 Business account, team, admin | **missing** | none | No business account / team / roles |
| B2B-11 Schemes & price advantage | **missing** | none | S35 exists, unreferenced; Price Advantage absent |

**Totals: 1 covered · 7 partial · 12 missing.**

The 7 client102-specific families (seller-*, marketplace-order, credit-order) serve different
actors and do **not** offset these gaps.

## 2. Gap — journeys

No client102 family exists for: consumer authentication, wishlist conversion, consumer
self-service, trade authentication, trade direct order, quick order, procurement list order,
catalogue direct order, project/site purchase, B2B post-order operations, business administration,
schemes/price advantage.

## 3. Gap — screens

**Frames present but absent from `screen_map` (15):**
`S20t`, `S4 · Cart`, `S5 · Checkout`, `S6 · Search results`, `S7 · Orders`, `S8 · B2B Home`,
`S9 · RFQ`, `S10 · Procurement list`, `S11 · Credit`, `S13 · Seller onboarding`,
`S14 · Seller catalogue`, `S15 · Seller fulfilment`, `S16 · Seller return`,
`S17 · Seller settlement`, `S18 · Marketplace order`.

**24 of 40 frames are referenced by no journey node**, including all six seller/admin/ERP frames.

**Guide-implied screens with no entry:** Sign Up; Browse; Category Results; Filter; dedicated
Addresses / Payment Methods / GST & Invoices / Help / Settings; OTP Verification; Quick Order
Center; B2B Catalogue; Business Checkout; B2B Confirmation; Accept Quote; GST Invoices; Approvals;
Projects & Sites; Project Detail; Material List; Site Selector; Split Tracking; Buyer-Seller Chat;
Business Account; Team & Roles; Price Advantage.

**Note:** there is no `S12`. Its intended meaning is unknown.

## 4. Gap — components

Drawn (45), contracted (33) and journey-referenced (23) are three different sets.

- **Contracted but missing from the IR list (7):** `commerce.quantity-stepper`,
  `control.filter-chip`, `commerce.trade-info-tile`, `commerce.trade-price-summary`,
  `commerce.volume-pricing-table`, `commerce.scheme-card`, `commerce.procurement-list-card`.
- **Drawn but neither contracted nor in the IR (7):** canvas masters `commerce.buy-again-card`,
  `merchandising.tile`, `commerce.quick-order-sku-card`, `b2b.procurement-filter-bar`,
  `commerce.carousel`, `commerce.flash-deals-carousel`, `marketing.secondary-banner`.
- **Guide components with no contract at all:** `HomeScrollFeed`, `ProductCompositionSection`,
  `CheckoutSummary`, `FormSection`, `B2BHeader`, `TradeAccountSummary`, `QuickOrderPanel`,
  `UtilityShortcutCard`, `CreditMetricCard`, `CreditActionCard`, quote card / comparison matrix,
  project / material / site cards, chat message + composer, team/member row; no
  navigation-**container** contract (only `navigation.bottom-nav-item`).
- **Name drift:** canvas `QuantityStepper` / `SchemeCard` / `ProcurementListCard` vs registry
  `commerce.quantity-stepper` / `commerce.scheme-card` / `commerce.procurement-list-card`.

## 5. Gap — flow integrity

Graph edges are internally consistent (linear chains, error recovery, terminal empty `next`).
Realisation is not:

| Journey | Result |
|---|---|
| browse-to-buy | pass, but `.3 add-cart` → Product Variant (semantic error) |
| search-to-buy | pass, missing filter / cart / payment nodes |
| order-tracking | pass |
| return-refund | **ambiguous** — review and refund-track share S26 |
| quote-to-order | **broken semantics** — Compare=Accept, Cart=Checkout, consumer S21 reused |
| repeat-order | **broken** — no checkout/confirmation after the cart node |
| credit-order, seller-onboarding, seller-catalogue, marketplace-order, seller-fulfilment, seller-return, seller-settlement | **0 nodes mapped** |

**26 of 51 nodes have no screen mapping.**

## 6. Gap — platform fidelity (the largest defect)

Component *declarations* are broadly consistent with the constraint. The **canvas is not**:

| Surface | Reality | Conflict |
|---|---|---|
| seller-portal (S13–S16) | 390×844 + bottom nav | web-only, designed as a phone shell |
| erp (S17) | 390×844 + admin bottom nav | web-only, designed as a phone shell |
| commerce-admin (S18) | 390×844 + admin bottom nav | web-only, designed as a phone shell |

## 7. Gap — web / superadmin

| Surface | Declared | Nodes | Status |
|---|---:|---:|---|
| web-store | yes | 0 | no journey, node or screen |
| analytics | yes | 0 | no journey, node or screen |
| ops-console | yes | 0 | no journey, node or screen |
| commerce-admin | yes | 3 | unmapped; one phone-form frame |
| erp | yes | 4 | unmapped; one phone-form frame |
| seller-portal | yes | 15 | unmapped; four phone-form frames |
| superadmin | **no** | 0 | surface not declared at all |

---

## 8. Recommended fills (prioritised)

**P0 — governance & correctness (no new screens required)**
1. Add the 15 ungoverned frames to `screen_map`; map the 26 unmapped nodes.
2. Fix `repeat-order.3` → Business Checkout, and add a confirmation node.
3. Split quote semantics: Compare / Accept / Quotation Cart / Business Checkout / B2B Confirmation.
4. Add B2C and B2B authentication families (incl. Sign Up, OTP).
5. Give return/refund distinct review vs refund-tracking states.
6. Declare `superadmin` as a web surface; record actor + capabilities.
7. Add a B2B-specific confirmation screen (stop reusing consumer S21).

**P1 — guide journeys & screens**
1. Wishlist-to-order and consumer self-service families (+ Addresses, Payments, Invoices, Help, Settings).
2. Direct-order, quick-order, procurement-list, catalogue-order families.
3. Project/site purchasing.
4. B2B post-order: split tracking, GST invoices, buyer-seller chat.
5. Business account / team / roles.
6. Schemes + price advantage.
7. Web baselines for `web-store`, `analytics`, `ops-console`.

**P2 — component-system normalisation**
1. Promote the 7 registry-only contracts into the IR.
2. Register the 7 canvas-only components.
3. Add `commerce.checkout-summary`, `form.section`, B2B header / quick-order panel / account
   summary / credit cards / quote comparison contracts.
4. Normalise canvas↔registry names.
5. Add a navigation-**container** contract.
6. Reclassify `S20t` (technical fragment, not a screen).
7. Correct the stale "17 component contracts" claim in `design-element-inventory.yaml` (actual: 33).

## 9. Not verifiable from the artifacts

Production interaction behaviour, responsive web behaviour, and runtime state transitions
cannot be established from the static `.fig` and YAML.
