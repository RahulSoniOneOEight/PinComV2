# M2 — Design-System Selection (client101 / BuildKart)

**Milestone:** second human gate (Steps 20–23 done properly)
**Reviewer:** RS (Project Lead)
**Status:** awaiting human review
**Penpot file:** `piv2` (rev 49) — connected via MCP

## 1. What already exists in Penpot

The `piv2` file already carries a **complete, coherent design system** (not a bare scaffold):

| Layer | Content |
|---|---|
| **Primitive tokens** | 24 colors (teal primary · ink text · gray neutrals · warm peach/amber/rust accents · red/blue/whatsapp feedback), 11 spacing, 7 radius, 12 font sizes, 6 weights, 2 borders |
| **Semantic tokens** | spacing (inset/stack/inline), radius (control/card/sheet/modal/pill), border width |
| **Theme modes** | `modes/light` — 37 semantic roles (bg, text, border, action, feedback, deal badge, rating, promo, header B2C/B2B gradients) |
| **Components** | 20 (Button, Input, Badge, ProductCard, ProductCardHorizontal, B2BProductCard, SearchBar, FilterChip, BottomNav, Tabs, QuantityStepper, PriceLine, Stepper, RadioCard, WhatsAppCTA, HScrollStrip, MerchandisingSlot, DeliverySelector, RelatedProductsRail, RelatedItemDrilldown) |
| **Screens** | 11 (B2C Home, B2B Home, B2B Search, B2C Cart, B2B Cart, Checkout, B2B Login, B2B Credit, B2C Confirmation, B2C Tracking, B2C Orders) |

## 2. Kit evaluation (≥3 references)

| Kit / direction | Verdict for client101 |
|---|---|
| **Material Design 3** | ❌ too generic/consumer; doesn't express the trade/building-materials warmth |
| **UI Design System (shadcn-style)** | ⚠️ good for web consistency, but too neutral/engineering for B2C brand |
| **Dashboard UI Kit / SnowUI** | ⚠️ useful *only* for seller/admin/ERP screens (B-side) |
| **Ant Design (enterprise)** | ❌ too admin-heavy for the consumer storefront |
| **Penpot DS (Pencil)** | ✅ reference only — shows token architecture (already reflected in piv2) |
| **Ecommerce UI Kit** | ✅ good starting point — already effectively realized in piv2 |

## 3. Decision

**The existing `piv2` system is the chosen design system** — a **custom teal-primary, warm-accent system**, deliberately *not* a stock kit:

- **Teal primary** + **ink text** + **warm accents (peach/amber/rust)** — distinctive and appropriate for a building-materials / home-improvement trade marketplace (warm = physical goods; teal = trust/action).
- Proper **token architecture** (`primitives → semantic → modes/light`) — already the "best-practice" pattern the kits would impose.
- **20 bespoke commerce components** (ProductCard, B2BProductCard, RFQ-adjacent, WhatsAppCTA, DeliverySelector…) — more relevant than any generic kit.
- Aligned with the **AC direction** (discovery-led B2C + conversion-led checkout + utility-led B2B).

**Selection: REUSE the piv2 custom system; do not import a stock kit.**

## 4. Gaps to close (not yet reflected in Penpot)

1. **Icons** — the governed Phosphor policy is *not instantiated* in the file (no icon glyphs on components). The registry (`icon-registry.yaml`, 26 icons) is defined but not applied to the Penpot components.
2. **Motion tokens** — no motion/duration tokens in the token sets (spacing/radius/color/type only).
3. **Theme binding** — the `AC` direction preset (`balanced-editorial`) is not yet expressed as a Penpot token theme.

## 5. Next action (to "finish" M2)

1. Instantiate the 26 Phosphor icons into the components (via MCP `import_image`/SVG or icon components).
2. Add a motion token set (durations/curves) matching `motion-registry.yaml`.
3. Bind the AC `balanced-editorial` preset as a Penpot theme.
4. Human review of the result.

*No selection is imposed here — this documents the existing system and the recommendation; the human decides.*
