# ApnaKart B2B Home Rev2 — Reuse Matrix

| Requirement | Existing Resource | Reuse / Adapt / New | OpenPencil Component | Flutter Mapping |
|---|---|---|---|---|
| Compact B2B header and global search | `commerce.search-bar`, existing `S8L` B2B header | Adapt | Screen composition using the existing palette and search pattern | Existing B2B home app bar + shared search field |
| Multi-select procurement-list filters | `b2b.procurement-filter-bar`, `FilterChip` | Adapt | `ProcurementFilters` | Multi-select filter-chip rail with preserved selected-list IDs |
| Four compact Quick Order SKU tiles in a 2×2 grid | `commerce.quick-order-sku-card`, `QuantityStepper` | Adapt | `TradeProductCard` variant `Compact` | `GridView`/sliver two-column compact product-card variant |
| Per-SKU quantity and Cart-Plus | `QuantityStepper`, `action.button` | Reuse | Nested controls in `TradeProductCard` | Independent quantity state and common-cart add command |
| Quick Order Center and procurement lists | `S53`, `S54`, `S55`, `ProcurementListCard` | Adapt | `W-B2B-01 · Procurement Lists (rev2)` | Procurement-list route with selected filter IDs in route state |
| Create list and add SKU to an existing list | Existing Quick Order Center patterns | New | `W-B2B-01A · Create / Add SKU to List (rev2)` | Separate create-list and add-SKU commands; no implicit cart mutation |
| Upload list and scan barcode in Level-2 only | Existing `S54` upload pattern | Adapt | Level-2 action pair | Upload and scanner services exposed only on procurement routes |
| Buy Again horizontal swimlane | `commerce.buy-again-card` | Adapt | `BuyAgainSwimlane` | Horizontal `ListView`; item action dispatches to common cart |
| Three featured offer collections | `merchandising.tile`, `SchemeCard` | Adapt | `CollectionCards` | Single-selected collection controller: Seasonal / Best Deals / Schemes |
| Full Trade Offers page | `S35 · Schemes & Offers`, `FilterChip` | Adapt | `W-B2B-02 · Trade Offers & Deals (rev2)` | Collection, sort and filter state over a two-column sliver grid |
| Single-select category rail | `FilterChip`, existing category rails | Adapt | `CategoryFilters` | Single selected category ID immediately filters product query |
| Home Products 2×N grid | `commerce.product-card`, trade pricing components | Adapt | `TradeProductCard` variant `Standard` | Responsive two-column sliver grid |
| Full Products Listing preserving category | `S56 · Catalogue` | Adapt | `W-B2B-03 · Products Listing (rev2)` | Products route carries category ID; search/sort/filter/pagination retained |
| Shared compact and standard trade cards | `commerce.stock-badge`, `commerce.offer-badge`, `commerce.price-block`, `VolumePricingTable`, `QuantityStepper` | New composition from reused parts | Real variant set `TradeProductCard` (`Compact`, `Standard`) | One semantic `TradeProductCard` with density/variant parameter |
| Product Detail with prominent Add to Cart | `S32 · Trade Price PDP`, `TradePriceSummary`, `TradeInfoTile`, `VolumePricingTable` | Adapt | `W-B2B-04 · Product Detail (rev2)` | Trade PDP route; tier, quantity, RFQ and cart commands remain independent |
| Compact common-cart summary | Existing `S8L` cart summary | Adapt | `CompactCartSummary` | Shared cart state selector and View Cart route |
| Common Cart → Checkout → Payment → Confirmation | `S27`, `S5`, `S51`, `S52` | Reuse | `W-B2B-05 · Common Cart Journey References (rev2)` | All entry points dispatch into the existing common cart/checkout flow |
| Bottom navigation: Trade, Credit, Orders, Account | `navigation.bottom-nav-item` | Adapt | `BottomNav` with four equal grow children | Existing four-destination B2B navigation shell |
| Placeholder product media | `media.placeholder` | Reuse | Governed product image slots | Existing placeholder/media resolver; no fabricated product photography |
