# M1 — Direction Review (A / B / C) — client101 (BuildKart)

**Milestone:** first human gate (Step 19 done properly)
**Reviewer:** RS (Project Lead)
**Status:** awaiting human decision

> Guiding principle: best-in-class, not bare minimum. This file is a *decision aid* — the final pick is yours.

---

## 1. Direction summary

| Axis | **A — Conversion-first** | **B — Utility-first** | **C — Brand & discovery-first** |
|---|---|---|---|
| Strategy | conversion-first | utility-first | brand-and-discovery-first |
| Density | balanced | compact | editorial |
| Navigation | guided | task-oriented | exploratory |
| Merchandising | transactional | information-dense | visual-storytelling |
| Motion | restrained | minimal | expressive-controlled |
| Best for | transactional checkout strength | B2B/ops efficiency | category discovery + brand trust |
| Risk | weak discovery for high-SKU catalogue | can feel dry/retail-boring for B2C | slower conversion, heavier for low bandwidth |

## 2. A/B/C comparison on the key decision axes

| Axis | A | B | C | Client101 fit |
|---|---|---|---|---|
| Multi-category catalogue (plumbing/electrical/agri) | OK, guided | OK, dense filters | ⭐ visual/spec-driven discovery | C-led |
| B2B RFQ/credit/approval | weak (transactional) | ⭐ task-oriented | weak | B-led |
| Mobile-first, low bandwidth, Hindi/EN | OK | ⭐ compact = data-light | ❌ editorial = heavy imagery | B-led |
| Seller comparison + trust | OK | OK | ⭐ seller transparency/badges | C-led |
| Checkout conversion | ⭐ | OK | OK | A-led |

→ **No single direction wins every axis.** Client101 is a B2C + B2B + marketplace product, so the choice is really about *which to lead with* (see §4).

## 3. Journey design — 18-field tables

> The first 14 layers are **direction-agnostic** (the journey is the same). The last 4 layers
> (`Touchpoint` emphasis, `System response`, `Emotion/friction`, `Resulting UI`) vary by direction and are shown as **A / B / C**.

### 3.1 browse-to-buy (B2C)

| Layer | Value |
|---|---|
| Persona | B2C household buyer (Tier-2) |
| Goal | Buy home-improvement items (e.g., 6 bathroom fittings) |
| Trigger | Opens app, taps category, sees deal banner |
| Context | Mobile, low bandwidth, Hindi/English, mixed catalogue |
| Phase | Discover → evaluate → buy |
| User action | Browse category → product → compare sellers → add to cart |
| Intent/thought | "Is this the right size / value / will it deliver here?" |
| Touchpoint | A: guided home→PDP · B: dense category+filter · C: editorial discovery rail |
| Information needed | price, pack size, delivery date, seller rating, return policy |
| Decision | Select SKU / seller / quantity |
| System response | A: instant add-to-cart + upsell · B: recalc price/stock fast · C: rich imagery load |
| Business rule | MOQ per seller; seller-wise return window |
| Success state | Item added to cart |
| Failure state | Stock unavailable / no delivery to pincode |
| Recovery | Alternate pack size / seller / nearby seller |
| Emotion/friction | A: least friction · B: neutral, info-dense · C: delight but heavier |
| Metric | conversion, task time, abandonment |
| Resulting UI | A: `ProductCard`+sticky CTA · B: `ProductCard`(compact)+`FilterChip` · C: `ProductCard`(visual)+`Carousel` |

### 3.2 search-to-buy (B2C)

| Layer | Value |
|---|---|
| Persona | B2C buyer with a known need (e.g., "1-inch PVC elbow") |
| Goal | Find a specific SKU and buy fast |
| Trigger | Taps search (voice/vernacular) |
| Context | Mobile, vernacular input, spec-driven products |
| Phase | Search → evaluate → buy |
| User action | Search → filter/sort → product → add to cart |
| Intent/thought | "Which seller has it in stock, cheapest, soonest?" |
| Touchpoint | A: guided search overlay · B: command-style search+filter · C: visual results |
| Information needed | price, stock, delivery, seller rating, specs (size/material/grade) |
| Decision | Select SKU / seller / quantity |
| System response | A: ranked by conversion · B: ranked by relevance+price · C: ranked by visual match |
| Business rule | spec attributes; MOQ; seller availability |
| Success state | Product added to cart |
| Failure state | No results / out-of-stock everywhere |
| Recovery | Similar SKU / back-in-stock alert / WhatsApp assist |
| Emotion/friction | A: fast · B: efficient · C: exploratory but slower |
| Metric | zero-result rate, search-to-cart rate, task time |
| Resulting UI | A: `SearchControl`+guided · B: `SearchControl`+`FilterChip` · C: `SearchControl`+visual grid |

### 3.3 order-tracking (B2C)

| Layer | Value |
|---|---|
| Persona | B2C buyer awaiting delivery |
| Goal | Know where the order / each package is |
| Trigger | Opens order / taps notification |
| Context | Mobile, split shipments (multi-seller) |
| Phase | Receive |
| User action | Open order → see shipment status → contact if stuck |
| Intent/thought | "When will it arrive? Is it split?" |
| Touchpoint | Orders page, notification, WhatsApp |
| Information needed | shipment status, transporter, ETA, seller per package |
| Decision | Wait / escalate |
| System response | A: minimal status + CTA · B: dense timeline · C: rich status visual |
| Business rule | split-order = per-seller tracking IDs |
| Success state | "Out for delivery" / "Delivered" |
| Failure state | Delay / NDR / failed delivery |
| Recovery | Reschedule / contact seller / raise exception |
| Emotion/friction | A: low · B: clear · C: reassuring visual |
| Metric | WISMO contacts, delivery exception rate |
| Resulting UI | `ShipmentStatus` + `OrderCard` (variant: customer) |

### 3.4 return-refund (B2C)

| Layer | Value |
|---|---|
| Persona | B2C buyer with a wrong/damaged item |
| Goal | Return / replace / refund without friction |
| Trigger | Opens order → return/replace |
| Context | Mobile, seller-specific return policies |
| Phase | Support / service |
| User action | Select product → reason → request return → track refund |
| Intent/thought | "Who pays return shipping? How long for refund?" |
| Touchpoint | Orders, return flow, WhatsApp |
| Information needed | return window, pickup option, refund status |
| Decision | Return / replace / refund |
| System response | A: 1-click return + status · B: clear step list · C: guided visual |
| Business rule | seller responsibility; refund liability; settlement adjustment |
| Success state | Return requested / refund issued |
| Failure state | Out-of-window / dispute |
| Recovery | Dispute escalation to platform admin |
| Emotion/friction | A: least friction · B: transparent · C: reassuring |
| Metric | return rate, refund TAT, disputes |
| Resulting UI | `ReturnStatus` + reason selector + `ShipmentStatus`(reverse) |

### 3.5 quote-to-order / RFQ (B2B)

| Layer | Value |
|---|---|
| Persona | Retailer / contractor buying bulk |
| Goal | Get best price for a quantity / material list |
| Trigger | RFQ / "Request Best Price" on high-value items |
| Context | B2B portal, GSTIN, trade pricing, MOQ |
| Phase | Evaluate → negotiate → buy |
| User action | Upload material list / SKU+Qty → get quotes → negotiate → accept |
| Intent/thought | "Best price for this quantity; can seller do better?" |
| Touchpoint | A: guided RFQ wizard · B: dense quote table · C: visual catalogue RFQ |
| Information needed | unit price, slab pricing, MOQ, lead time, seller |
| Decision | Accept / counter-offer / reject quote |
| System response | A: single best-price · B: side-by-side quotes · C: rich comparison |
| Business rule | quantity slabs, trade tiers, credit limit |
| Success state | Quote accepted → order |
| Failure state | No quotes / price too high |
| Recovery | Counter-offer / alternate seller / WhatsApp |
| Emotion/friction | A: simple · B: efficient for power users · C: heavy |
| Metric | RFQ→order rate, negotiation cycles |
| Resulting UI | `RFQForm` + `DataTable`(quotes) + `CreditLimit` |

### 3.6 repeat-order / reorder (B2B)

| Layer | Value |
|---|---|
| Persona | Retailer / contractor reordering |
| Goal | Reorder previous purchase / saved list fast |
| Trigger | Reorder reminder / stock low / open history |
| Context | B2B, project/site lists, credit |
| Phase | Reorder |
| User action | Open history / project → reorder → checkout |
| Intent/thought | "Same as last time, restock" |
| Touchpoint | A: one-tap reorder · B: SKU+qty quick order · C: visual history |
| Information needed | SKU, qty, price, credit available |
| Decision | Reorder as-is / edit qty |
| System response | A: instant reorder CTA · B: fast SKU entry · C: rich list |
| Business rule | MOQ, credit limit, trade price |
| Success state | Reorder placed |
| Failure state | Price/stock changed |
| Recovery | Adjust qty / alternate seller |
| Emotion/friction | A: minimal · B: fastest · C: moderate |
| Metric | reorder rate, repeat purchase cycle |
| Resulting UI | `ReorderAction` + `OrderCard`(b2b) |

### 3.7 credit-order (B2B, with approval)

| Layer | Value |
|---|---|
| Persona | Retailer / business sub-user |
| Goal | Buy on credit within limit / get approval |
| Trigger | Checkout with credit / order over threshold |
| Context | B2B, credit limit, payment terms, multi-user approval |
| Phase | Buy |
| User action | Select credit → submit → (manager) approve → order |
| Intent/thought | "Is my credit sufficient? Will it be approved?" |
| Touchpoint | A: simple credit selector · B: balance+terms panel · C: visual account |
| Information needed | credit limit, available, terms, outstanding |
| Decision | Use credit / partial payment / request approval |
| System response | A: auto-approve if within limit · B: explicit approval step · C: clear status |
| Business rule | credit limit, 30-day terms, approval workflow |
| Success state | Order approved & placed |
| Failure state | Limit exceeded / approval rejected |
| Recovery | Partial payment / manager override / alternate payment |
| Emotion/friction | A: low · B: clear on risk · C: reassuring |
| Metric | credit approval TAT, order rate |
| Resulting UI | `CreditLimit` + `ApprovalStatus` + `CheckoutSummary` |

### 3.8–3.13 Seller & operations journeys (gap flagged)

| Journey | Surface | Status in current prototype |
|---|---|---|
| seller-onboarding | seller-portal | ❌ not designed |
| seller-catalogue | seller-portal | ❌ not designed |
| marketplace-order (allocation) | commerce-admin | ❌ not designed |
| seller-fulfilment | seller-portal | ❌ not designed |
| seller-return | seller-portal | ❌ not designed |
| seller-settlement | seller-portal / erp | ❌ not designed |

> These 6 journeys are **required by the client** but have **no screens in `piv2`**. They must be designed in M2/final — the 18-field tables for them are a separate deliverable, not a direction decision.

## 4. Conclusive judgment (recommendation)

**Recommendation: lead with C's discovery/trust, keep B's B2B efficiency, retain A's checkout discipline — i.e. the A+C hybrid (with B for B2B surfaces).**

| Surface | Lead with | Why |
|---|---|---|
| B2C storefront (customer-app, web-store) | **C** (discovery/trust) + **A** (checkout) | spec-driven catalogue needs visual discovery; checkout needs conversion |
| B2B portal | **B** (utility/task-oriented) | RFQ, credit, reorder are task-heavy |
| Seller / admin / ERP | **B** (compact/ops) | operations = dense, efficient |

This matches the already-selected `DIR-CLIENT101-AC`, but refines it: **C-led for B2C discovery, A for checkout, B for B2B/ops.**

**Decision needed (human):** pick one of —
1. **AC hybrid** (C discovery + A checkout, B for B2B) — recommended.
2. **A-led** (conversion everywhere).
3. **B-led** (utility everywhere).
4. **C-led** (discovery everywhere).

*No selection is made here — this is the evidence for you to decide.*
