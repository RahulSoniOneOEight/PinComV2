Note on the Customer-Facing Marketplace Store (Design Direction)
The customer store is designed to function as a digital "Mall" where buyers can browse products from hundreds of independent sellers in one unified experience. Unlike a standard e-commerce site, this store must handle diverse product categories (hardware, tiles, sanitary ware, agri-tools, electricals) while allowing buyers to compare and purchase from multiple sellers in a single checkout.

Core Experience Philosophy:

Mobile-First & Data-Light: Optimized for 4G networks and budget smartphones common in tier-2 cities – lazy loading, image compression, and offline caching for product catalogues.

Visual & Spec-Driven Discovery: Heavy/bulky items like tiles and sanitary ware require high-resolution zoomable images and clear technical specifications (dimensions, weight, material, voltage, etc.). The UI prioritizes spec sheets alongside visuals.

Seller Transparency: Every product page clearly displays the seller's identity, rating, KYC verification badge, and response time – building trust in a marketplace environment.

Real-Time Communication: Integrated buyer-seller chat allows customers to ask product-specific questions (e.g., "Is this tile available in a lighter shade?" or "What is the bolt size for this agricultural tool?") before making a purchase – crucial for technical goods.

Unified Checkout with Split Logic: Buyers can add items from different sellers into one cart and pay once. The system silently splits the order behind the scenes, so the buyer experiences a seamless, Amazon-like checkout.

Localized & Vernacular: Interface supports multiple Indian languages (Hindi, Tamil, Telugu, etc.) with currency localization and region-specific payment methods (UPI, COD, Net Banking).

Trust Anchors: Prominent display of seller ratings, "Verified Seller" badges, and easy-to-understand return policies to encourage first-time buyers in tier-2 markets to transact confidently.

Key Features of the Customer Store (Front-End Marketplace)
Feature Area	Specific Capabilities for the Buyer
1. Smart Browsing & Discovery	- Multi-Category Navigation: Hierarchical menus tailored for Hardware, Tiles, Sanitaryware, Agri-tools, and Electricals.
- Advanced Filters: Filter by price, brand, seller location (city/state), delivery speed, product dimensions/weight, and customer ratings.
- Voice Search & Auto-Suggest: Supports vernacular language input for users less comfortable with typing.
- Bulk Buying Options: Special UI for B2B buyers to select quantities in boxes/pallets (e.g., buying tiles by square feet or boxes).
2. Multi-Seller Product Page	- Seller Comparison Table: Shows all sellers offering the same product side-by-side with price, delivery estimate, and seller rating.
- Attribute Showcase: Custom attribute panels (e.g., Voltage for electricals, Size/Finish for tiles, Weight for agri-tools) with standardized spec sheets.
- High-Res Zoom & 360° View: For visual-heavy categories like tiles and sanitary ware.
- Stock Availability: Real-time "In Stock" status per seller/warehouse.
3. Shopping Cart & Checkout	- Unified Cart: Add products from multiple sellers into a single cart.
- Transparent Split Checkout: One payment transaction; the breakdown clearly shows subtotals per seller, shipping charges, and applicable taxes (GST).
- Flexible Payment Options: UPI, Credit/Debit Cards, Net Banking, and Cash-on-Delivery (COD) with COD limits per seller.
- Saved Addresses: Manage multiple delivery addresses (home, office, site/construction address).
4. Real-Time Buyer-Seller Chat	- In-App Instant Messaging: Buyers can chat directly with the seller before placing an order.
- Media Attachments: Send images or PDFs (e.g., to show site measurements or specific color requirements).
- Quick Replies: Pre-set enquiry templates (e.g., "What is the warranty?", "Is installation service available?").
- Chat History: Persistent chat logs attached to the order for future reference.
5. Order Management & Tracking	- Split Order Tracking: Since orders are split by seller, the buyer sees individual tracking IDs for each package/seller on the "My Orders" page.
- Live Shipment Status: Real-time updates from integrated logistics partners (e.g., Delhivery, Ecom Express).
- Delivery Confirmation: Push notifications and in-app alerts for "Out for Delivery" and "Delivered".
6. Trust, Reviews & Ratings	- Product Reviews: Star ratings with photo/video reviews from verified purchasers.
- Seller Ratings: Overall seller score based on delivery speed, packaging, and service quality.
- Verification Badges: "GST Verified", "Top-Rated Seller", "Quick Responder" badges displayed on product pages and chat.
7. Returns, Refunds & Disputes	- Seller-Specific Return Policy: Clear visibility of return window (e.g., 7-day replacement) and process before adding to cart.
- Raise Return/Refund Request: One-click request generation attached to the specific order.
- Dispute Logging: If the seller and buyer disagree, buyers can escalate to the platform admin directly from the order page.
8. Personalization & Notifications	- Push Notifications: Order confirmations, shipping updates, promo alerts, and chat message alerts.
- WhatsApp/SMS Alerts: Fallback communication for transactional updates (critical in tier-2 cities where app push might be unreliable).
- Wishlist & Saved Carts: Save products for later purchase or price tracking.
9. Location-Based Experience	- Pincode Checker: Immediately check if a product/seller delivers to the buyer's pincode before adding to cart.
- Nearby Sellers: Option to filter sellers located in the same city/state for faster delivery (especially useful for bulky tiles and sanitary ware).
10. Performance Optimization for Tier-2	- Data Saver Mode: Option to reduce image quality to save mobile data.
- Offline Mode: Browsing recently viewed products even without an active internet connection.
This customer store is the primary revenue engine of the platform. By combining a frictionless shopping experience with real-time communication and transparent seller comparisons, it addresses the specific needs of tier-2 Indian buyers who require both trust and detailed product information for high-value, physical goods.

