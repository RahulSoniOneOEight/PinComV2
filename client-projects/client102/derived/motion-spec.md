# ApnaKart mobile motion specification

OpenPencil frames are static. The behaviours below are **intended Flutter animations**, not implemented or demonstrated as working interactions in the design file. Use the platform reduced-motion preference to replace movement with an immediate state change or a short opacity transition.

| Interaction | Duration | Curve | Flutter intent |
|---|---:|---|---|
| Cart-Plus press | 150 ms | easeOut | Scale icon to 0.92, restore, then swap to a check for 600 ms; announce cart count through semantics. |
| Cart count update | 180 ms | easeOut | `AnimatedSwitcher` with a short fade/vertical 4 px slide; no full-screen toast. |
| Quantity step | 150 ms | easeOut | Cross-fade the numeral and briefly tint the stepper with `interactive`; disable at limits. |
| Filter chip select | 180 ms | easeInOut | Animate fill, border, and label colour; selected indicator fades in without changing chip width. |
| Collection selector | 200 ms | easeInOut | Move the selected surface and cross-fade the assigned SKU swimlane. |
| Product swimlane drag | 200 ms | easeOut | Native inertial horizontal scroll with an 8 px end reveal; no auto-advancing carousel. |
| Procurement-list multi-select | 180 ms | easeInOut | Checkmark and selected fill animate together; preserve chip position. |
| List expansion / collapse | 220 ms | easeInOut | `AnimatedSize` vertically expands related items, frequently bought together, or list details; rotate chevron 180°. |
| Sort / filter sheet | 250 ms | easeOutCubic | Modal bottom sheet enters from bottom; backdrop fades to 24% content-primary. |
| Search results refresh | 200 ms | easeOut | Cross-fade skeleton cards to results; retain scroll position when filters change. |
| Add SKU / Scan / Upload success | 220 ms | easeOut | Inline success row expands below the action and then remains until dismissed; never fake scanning in static design. |
| Checkout step change | 220 ms | easeInOut | Progress indicator fill advances while content cross-fades; back navigation reverses direction. |
| Payment method select | 180 ms | easeInOut | Radio/icon and containing surface animate to selected colours; total remains fixed. |
| Order placed | 250 ms | easeOutBack | Check icon scales from 0.85 to 1.0 with subtle opacity; avoid confetti for trade orders. |
| Credit utilisation update | 220 ms | easeInOut | Progress bar width animates from previous value; numeric KPI cross-fades. |
| Order status progression | 220 ms | easeInOut | Connector line fills to the next status; status icon fades/scales in. |
| Navigation tab change | 180 ms | easeOut | Active icon/label colour cross-fades; content uses no more than an 8 px directional slide. |
| Back navigation | 200 ms | easeOut | Platform-appropriate route transition; preserve Hero imagery only when source and destination share a product. |
| Error / retry | 180 ms | easeOut | Error message fades in and action receives focus; avoid shake animation. |

All interactive targets remain at least 44×44 logical pixels. Animations must not block taps, change the final layout, or imply that a static OpenPencil frame is executable.
