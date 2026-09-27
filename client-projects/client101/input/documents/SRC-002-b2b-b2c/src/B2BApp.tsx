import { useState, useRef, useEffect } from "react";
import { PRODUCTS, CATEGORIES, type Product } from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────

type BuyerType = "Retailer" | "Dealer" | "Distributor" | "Contractor" | "Plumber" | "Electrician" | "Builder" | "Farmer" | "Institution";
type B2BScreen = "register" | "home" | "product" | "bulklist" | "cart" | "checkout" | "confirm" | "dashboard" | "quotations" | "category" | "credit";
type CreditTab = "overview" | "outstanding" | "paynow" | "limit" | "settlement" | "history" | "collections";
type UOM = "Pcs" | "Box" | "Carton" | "Set" | "Kg" | "Mtr";

export interface B2BUser {
  name: string; phone: string; businessName: string; gstin: string;
  buyerType: BuyerType; city: string;
  creditLimit: number; creditUsed: number; paymentTerms: string;
}

interface B2BCartItem {
  product: Product; qty: number; uom: UOM; sellerIdx: number; pricePerUnit: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

function getTierPrice(base: number, buyerType: BuyerType, qty: number): number | null {
  const disc = buyerType === "Distributor" ? null
    : buyerType === "Dealer" ? 0.11
    : ["Contractor", "Plumber", "Electrician", "Builder", "Farmer"].includes(buyerType) ? 0.06
    : buyerType === "Institution" ? 0.04 : 0;
  if (disc === null) return null;
  const qDisc = qty >= 100 ? 0.04 : qty >= 25 ? 0.02 : qty >= 10 ? 0.01 : 0;
  return Math.round(base * (1 - disc - qDisc));
}

function getMOQ(cat: string) {
  return ({ plumbing: 5, electrical: 2, sanitary: 1, construction: 10, hardware: 1, agriculture: 2 } as Record<string, number>)[cat] || 1;
}
function getPackSize(cat: string) {
  return ({ plumbing: 20, electrical: 6, sanitary: 1, construction: 40, hardware: 10, agriculture: 5 } as Record<string, number>)[cat] || 10;
}
function getStock(p: Product) { return ((p.id * 17 + 40) % 400) + 30; }

function getSellers(p: Product) {
  const base = p.price;
  return [
    { name: p.seller.name, city: p.seller.city, rating: p.seller.rating, price: base, moq: getMOQ(p.cat), delivery: "Tomorrow", stock: getStock(p), gst: true, kyc: true, credit: "7 Days" },
    { name: "Metro Trade Co.", city: p.seller.city, rating: 4.3, price: Math.round(base * 0.97), moq: getMOQ(p.cat) * 4, delivery: "2 Days", stock: Math.round(getStock(p) * 0.4), gst: true, kyc: false, credit: "None" },
    { name: "Wholesale Hub Pvt", city: "Mumbai", rating: 4.1, price: Math.round(base * 0.94), moq: getMOQ(p.cat) * 20, delivery: "3–4 Days", stock: Math.round(getStock(p) * 5), gst: true, kyc: true, credit: "30 Days" },
  ];
}

function getSlabs(base: number, moq: number) {
  return [
    { label: `${moq}–${moq * 4 - 1} pcs`, price: base, tag: "" },
    { label: `${moq * 4}–${moq * 20 - 1} pcs`, price: Math.round(base * 0.97), tag: "3% off" },
    { label: `${moq * 20}+ pcs`, price: Math.round(base * 0.94), tag: "6% off" },
  ];
}

const BUYER_TYPES: BuyerType[] = ["Retailer", "Dealer", "Distributor", "Contractor", "Plumber", "Electrician", "Builder", "Farmer", "Institution"];
const BUYER_ICONS: Record<BuyerType, string> = {
  Retailer: "🏪", Dealer: "🤝", Distributor: "🏭", Contractor: "👷",
  Plumber: "🔩", Electrician: "⚡", Builder: "🏗️", Farmer: "🌾", Institution: "🏛️",
};

const TIER_DISC: Record<BuyerType, string> = {
  Distributor: "Custom", Dealer: "11%", Contractor: "6%", Builder: "6%",
  Plumber: "6%", Electrician: "6%", Farmer: "6%", Institution: "4%", Retailer: "0%",
};

// ── Shared mini components ────────────────────────────────────────────────────

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span className="text-[8px] font-black px-1 py-0.5 rounded border leading-none whitespace-nowrap"
      style={{ color, background: bg, borderColor: border || color + "44" }}>
      {label}
    </span>
  );
}

function MiniStars({ r }: { r: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: r >= 4.3 ? "#2F7F75" : "#C8934A", color: "#fff" }}>
      {r.toFixed(1)} ★
    </span>
  );
}

// ── B2B Product Card — data-dense, trade-first ───────────────────────────────

function B2BProductCard({ p, b2bUser, onClick, onAddOrder, onRFQ }: {
  p: Product; b2bUser: B2BUser; onClick: () => void;
  onAddOrder: (e: React.MouseEvent) => void; onRFQ: (e: React.MouseEvent) => void;
}) {
  const moq = getMOQ(p.cat);
  const pack = getPackSize(p.cat);
  const stock = getStock(p);
  const sellers = getSellers(p);
  const tradePrice = getTierPrice(sellers[0].price, b2bUser.buyerType, moq);
  const bulkPrice = getTierPrice(sellers[0].price, b2bUser.buyerType, moq * 20);
  const hasDisc = tradePrice !== null && tradePrice < sellers[0].price;

  return (
    <div onClick={onClick} className="bg-bk-card border border-bk-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-bk-teal transition-all active:scale-[0.98]">
      {/* Compact image strip */}
      <div className="relative bg-bk-mint overflow-hidden" style={{ height: 110 }}>
        <img src={p.img} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-1.5 gap-1">
          <div className="flex flex-col gap-0.5">
            {stock < 60 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ background: "#F6C6A8", color: "#7A3A1A" }}>Low Stock</span>}
            {stock >= 200 && <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ background: "#EEF8F5", color: "#2F7F75" }}>In Stock</span>}
          </div>
          {hasDisc && bulkPrice !== null && (
            <span className="text-[8px] font-black px-1 py-0.5 rounded text-white" style={{ background: "#2F7F75" }}>Bulk ↓</span>
          )}
        </div>
      </div>

      {/* Data-dense info block */}
      <div className="p-2.5">
        <p className="text-[8px] font-black uppercase tracking-wider mb-0.5" style={{ color: "#2F7F75" }}>{p.brand}</p>
        <p className="text-[11px] font-semibold text-bk-ink leading-tight line-clamp-2 mb-2">{p.name}</p>

        {/* Key trade specs in a mini grid */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 mb-2 text-[9px] text-bk-ink2">
          <span className="text-bk-muted">MOQ</span>
          <span className="text-bk-muted">Pack</span>
          <span className="text-bk-muted">Stock</span>
          <span className="font-bold text-bk-ink">{moq} pcs</span>
          <span className="font-bold text-bk-ink">{pack}/box</span>
          <span className={`font-bold ${stock < 60 ? "text-amber-600" : "text-bk-blue"}`}>{stock} pcs</span>
        </div>

        {/* Pricing block */}
        {tradePrice !== null ? (
          <div className="rounded-lg px-2 py-1.5 mb-2" style={{ background: "#EEF8F5" }}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-bk-ink">{fmt(tradePrice)}<span className="text-[8px] font-semibold text-bk-muted">/pc</span></span>
              {hasDisc && <span className="text-[8px] font-bold" style={{ color: "#2F7F75" }}>{TIER_DISC[b2bUser.buyerType]} off</span>}
            </div>
            {bulkPrice !== null && bulkPrice < tradePrice && (
              <p className="text-[8px] text-bk-muted mt-0.5">{fmt(bulkPrice)}/pc for {moq * 20}+ pcs</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg px-2 py-1.5 mb-2 text-center" style={{ background: "#EEF8F5" }}>
            <span className="text-[10px] font-black text-bk-blue">Price on Request</span>
          </div>
        )}

        <p className="text-[8px] text-bk-muted mb-2">📍 {p.seller.city} · {p.delivery} · {getSellers(p).length} sellers</p>

        {/* CTAs */}
        <div className="flex gap-1.5">
          {tradePrice !== null ? (
            <button onClick={onAddOrder} className="flex-1 py-1.5 text-white text-[10px] font-black rounded-lg hover:opacity-90 transition-opacity" style={{ background: "#2F7F75" }}>
              Add to Order
            </button>
          ) : null}
          <button onClick={onRFQ} className={`${tradePrice !== null ? "" : "flex-1"} py-1.5 text-[10px] font-black rounded-lg border-2 transition-all hover:text-white`}
            style={{ borderColor: "#2F7F75", color: "#2F7F75", minWidth: tradePrice !== null ? 72 : undefined }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "#2F7F75"; el.style.color = "#fff"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "#2F7F75"; }}>
            {tradePrice !== null ? "RFQ" : "Request Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── B2B Registration ──────────────────────────────────────────────────────────

function B2BRegister({ user, onDone, onBack }: { user: { name: string; phone: string }; onDone: (u: B2BUser) => void; onBack: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [buyerType, setBuyerType] = useState<BuyerType | "">("");
  const [city, setCity] = useState("Jaipur");
  const [verifying, setVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  function verifyGST() {
    if (gstin.length < 15) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setGstVerified(true); setBusinessName("Arjun Traders Pvt Ltd"); }, 1200);
  }

  function complete() {
    if (!businessName || !buyerType) return;
    const creditByType: Record<string, number> = { Dealer: 200000, Distributor: 500000, Contractor: 150000, Builder: 300000, Institution: 250000, Retailer: 50000, Plumber: 30000, Electrician: 30000, Farmer: 40000 };
    onDone({
      name: user.name, phone: user.phone, businessName, gstin, buyerType: buyerType as BuyerType, city,
      creditLimit: creditByType[buyerType] || 50000,
      creditUsed: buyerType === "Dealer" ? 65000 : 0,
      paymentTerms: ["Dealer", "Distributor", "Builder", "Institution"].includes(buyerType) ? "30 Days" : "Immediate",
    });
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface px-4 py-6">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-bk-blue text-xs font-bold mb-5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>Back
        </button>
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step >= s ? "text-white" : "text-bk-muted border-2 border-bk-border"}`} style={step >= s ? { background: "#2F7F75" } : {}}>
                {step > s ? "✓" : s}
              </div>
              <span className={`text-[11px] font-bold ${step >= s ? "text-bk-blue" : "text-bk-muted"}`}>{s === 1 ? "Business Details" : "Trade Type"}</span>
              {s < 2 && <div className={`w-6 h-0.5 ${step > s ? "bg-bk-teal" : "bg-bk-border"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-black text-bk-ink">Business Registration</h1><p className="text-xs text-bk-muted mt-0.5">GSTIN auto-fills your business details</p></div>
            <div className="bg-bk-card rounded-2xl p-4 border border-bk-border space-y-3">
              <div>
                <label className="block text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-1.5">GSTIN</label>
                <div className="flex gap-2">
                  <input value={gstin} onChange={(e) => { setGstin(e.target.value.toUpperCase().slice(0, 15)); setGstVerified(false); }} placeholder="27AAAPL1234C1Z5" className="flex-1 border-2 border-bk-border rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-bk-teal transition-colors" maxLength={15} />
                  <button onClick={verifyGST} disabled={gstin.length < 15 || verifying} className="px-4 py-2 text-white text-xs font-black rounded-xl disabled:opacity-40" style={{ background: "#2F7F75" }}>
                    {verifying ? "…" : gstVerified ? "✓ Verified" : "Verify"}
                  </button>
                </div>
                {gstVerified && <p className="text-[11px] font-bold mt-1" style={{ color: "#2F7F75" }}>✓ GST verified · Business name auto-filled</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-1.5">Business Name *</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Arjun Traders Pvt Ltd" className="w-full border-2 border-bk-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-bk-teal transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-1.5">City</label>
                <div className="flex gap-1.5 flex-wrap">
                  {["Jaipur", "Mumbai", "Delhi", "Hyderabad", "Bengaluru", "Pune"].map((c) => (
                    <button key={c} onClick={() => setCity(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all" style={city === c ? { background: "#2F7F75", color: "#fff", borderColor: "#2F7F75" } : { borderColor: "#E3E8E6", color: "#6F7A7A" }}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!businessName.trim()} className="w-full py-4 text-white font-black text-sm rounded-2xl disabled:opacity-40 shadow-md" style={{ background: "#2F7F75" }}>Continue →</button>
            <div className="bg-bk-mint rounded-xl p-3 border border-bk-border text-center">
              <p className="text-[10px] text-bk-muted">Demo: Tap "Verify" to auto-fill · or enter any name and skip GSTIN</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-black text-bk-ink">What describes you?</h1><p className="text-xs text-bk-muted mt-0.5">Sets your trade prices and credit eligibility</p></div>
            <div className="grid grid-cols-3 gap-2">
              {BUYER_TYPES.map((t) => (
                <button key={t} onClick={() => setBuyerType(t)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all"
                  style={buyerType === t ? { borderColor: "#2F7F75", background: "#EEF8F5" } : { borderColor: "#E3E8E6" }}>
                  <span className="text-2xl">{BUYER_ICONS[t]}</span>
                  <span className="text-[10px] font-bold text-center leading-tight" style={{ color: buyerType === t ? "#2F7F75" : "#37474F" }}>{t}</span>
                  <span className="text-[9px] font-black" style={{ color: buyerType === t ? "#2F7F75" : "#6F7A7A" }}>{TIER_DISC[t]} disc</span>
                </button>
              ))}
            </div>
            {buyerType && (
              <div className="rounded-xl p-3 border text-xs" style={{ background: "#EEF8F5", borderColor: "#7CCFC166" }}>
                <p className="font-black text-bk-blue mb-1">{buyerType} benefits:</p>
                <div className="grid grid-cols-2 gap-1 text-bk-ink2 text-[11px]">
                  {buyerType === "Distributor" ? <>
                    <span>✓ Custom RFQ pricing</span><span>✓ ₹5L credit limit</span>
                    <span>✓ Dedicated manager</span><span>✓ 30-day terms</span>
                  </> : buyerType === "Dealer" ? <>
                    <span>✓ 11% trade discount</span><span>✓ ₹2L credit limit</span>
                    <span>✓ 30-day payment</span><span>✓ Dealer invoices</span>
                  </> : <>
                    <span>✓ {TIER_DISC[buyerType]} trade discount</span><span>✓ {fmt(({ Contractor: 150000, Builder: 300000, Plumber: 30000, Electrician: 30000, Farmer: 40000, Institution: 250000, Retailer: 50000 } as Record<string, number>)[buyerType] || 50000)} credit</span>
                    <span>✓ Quick reorder</span><span>✓ GST invoices</span>
                  </>}
                </div>
              </div>
            )}
            <button onClick={complete} disabled={!buyerType} className="w-full py-4 text-white font-black text-sm rounded-2xl disabled:opacity-40 shadow-md" style={{ background: "#2F7F75" }}>
              🏢 Enter Trade Portal →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── B2B Home — speed-first, procurement-oriented ──────────────────────────────

function B2BHome({ b2bUser, onProduct, onBulkList, onDashboard, onQuotations, onQuickOrder, onCat }: {
  b2bUser: B2BUser; onProduct: (p: Product) => void; onBulkList: () => void;
  onDashboard: () => void; onQuotations: () => void; onQuickOrder: () => void; onCat: (id: string) => void;
}) {
  const [quickSkus, setQuickSkus] = useState([{ sku: "", qty: "" }, { sku: "", qty: "" }]);
  const creditPct = Math.round((b2bUser.creditUsed / b2bUser.creditLimit) * 100);
  const tradeProducts = PRODUCTS.filter((p) => p.rating >= 4.4).slice(0, 16);

  const PAST_ORDERS = [
    { id: "BKB-229841", items: "Havells BLDC Fan ×5, Jaquar BibCock ×20", total: "₹28,450", date: "24 Aug" },
    { id: "BKB-229712", items: "Asian Paints 20L ×8, Pidilite DrFixit ×4", total: "₹15,680", date: "18 Aug" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      {/* Trade account strip — always visible */}
      <div className="px-3 py-3 border-b border-bk-border" style={{ background: "#F7FBFA" }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-bk-ink">{b2bUser.businessName}</span>
              <Badge label={b2bUser.buyerType} color="#2F7F75" bg="#EEF8F5" />
              {b2bUser.gstin && <Badge label={`GST ✓`} color="#4A7FB8" bg="#EAF3FD" />}
              <Badge label={`${TIER_DISC[b2bUser.buyerType]} trade disc`} color="#2F7F75" bg="#EEF8F5" />
            </div>
          </div>
          {b2bUser.creditLimit > 0 && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-bk-muted">Credit:</span>
              <div className="w-20 h-1.5 bg-bk-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${creditPct}%`, background: creditPct > 70 ? "#E99C98" : "#2F7F75" }} />
              </div>
              <span className="font-bold text-bk-ink">{fmt(b2bUser.creditLimit - b2bUser.creditUsed)} free</span>
              <button onClick={onDashboard} className="text-bk-blue font-bold hover:underline">View →</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 py-3">
        <div className="md:grid md:grid-cols-3 md:gap-4">
          {/* Left col: Quick Order + Reorder */}
          <div className="md:col-span-1 space-y-3 mb-3 md:mb-0">
            {/* Quick Order by SKU */}
            <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-bk-ink">⚡ Quick Order</p>
                <button onClick={onQuickOrder} className="text-[10px] text-bk-blue font-bold hover:underline">Expand</button>
              </div>
              <div className="space-y-2">
                {quickSkus.map((r, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input value={r.sku} onChange={(e) => { const n = [...quickSkus]; n[i].sku = e.target.value; setQuickSkus(n); }} placeholder={i === 0 ? "SS304-BIB-15" : "SKU / product code"} className="flex-1 border border-bk-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-bk-teal transition-colors" />
                    <input type="number" value={r.qty} onChange={(e) => { const n = [...quickSkus]; n[i].qty = e.target.value; setQuickSkus(n); }} placeholder="Qty" min={1} className="w-14 border border-bk-border rounded-lg px-2 py-1.5 text-[11px] text-center font-bold outline-none focus:border-bk-teal transition-colors" />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setQuickSkus([...quickSkus, { sku: "", qty: "" }])} className="text-[10px] text-bk-blue font-bold">+ Add row</button>
                  <button className="flex-1 py-2 rounded-lg text-white text-[11px] font-black hover:opacity-90" style={{ background: "#2F7F75" }}>Add to Order →</button>
                </div>
              </div>
            </div>

            {/* Quick Reorder */}
            <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
              <p className="text-xs font-black text-bk-ink mb-3">🔄 Repeat Orders</p>
              {PAST_ORDERS.map((o) => (
                <div key={o.id} className="flex items-center gap-2 py-2.5 border-b border-bk-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-bk-ink">#{o.id} <span className="font-normal text-bk-muted">{o.date}</span></p>
                    <p className="text-[9px] text-bk-muted truncate">{o.items}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-bk-ink">{o.total}</span>
                    <button className="text-[9px] font-black px-2 py-0.5 rounded text-white" style={{ background: "#2F7F75" }}>Reorder</button>
                  </div>
                </div>
              ))}
            </div>

            {/* RFQ CTA */}
            <div className="rounded-2xl p-4 border" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)", borderColor: "#7CCFC1" }}>
              <p className="text-sm font-black text-white mb-1">📋 Bulk Material RFQ</p>
              <p className="text-[11px] text-white/80 mb-3">Send your material list to multiple sellers. Get competing quotes in 2–4 hours.</p>
              <button onClick={onBulkList} className="w-full py-2.5 font-black text-sm rounded-xl hover:opacity-90 transition-opacity" style={{ background: "#FAF8F3", color: "#2F7F75" }}>
                Upload Material List →
              </button>
            </div>

            {/* Active quotations */}
            <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-black text-bk-ink">Active Quotations</p>
                <button onClick={onQuotations} className="text-[10px] text-bk-blue font-bold">View All →</button>
              </div>
              {[
                { id: "RFQ-2841", status: "Quoted", n: 3, items: "BibCock ×40, Basin ×12" },
                { id: "RFQ-2839", status: "Pending", n: 0, items: "BLDC Fan ×15" },
              ].map((q) => (
                <div key={q.id} className="flex items-center gap-2 py-2 border-b border-bk-border last:border-0">
                  <span className="text-base">{q.status === "Quoted" ? "✅" : "⏳"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-bk-ink">{q.id}</p>
                    <p className="text-[9px] text-bk-muted truncate">{q.items}</p>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: q.status === "Quoted" ? "#2F7F75" : "#C8934A" }}>{q.status === "Quoted" ? `${q.n} quotes` : "Pending"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right col: Categories + Products */}
          <div className="md:col-span-2 space-y-3">
            {/* Category nav — compact, information-dense */}
            <div className="bg-bk-card rounded-2xl border border-bk-border p-3 shadow-sm">
              <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2.5">Trade Catalogue</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => onCat(cat.id)} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-bk-border hover:border-bk-teal hover:bg-bk-mint transition-all group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
                    <span className="text-[8px] font-bold text-bk-ink2 text-center leading-tight group-hover:text-bk-blue">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product grid — data dense */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-bk-ink">Trade Picks</p>
                  <Badge label={`${b2bUser.buyerType} price`} color="#2F7F75" bg="#EEF8F5" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-bk-muted">
                  <span>Showing MRP → your price</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {tradeProducts.map((p) => (
                  <B2BProductCard key={p.id} p={p} b2bUser={b2bUser}
                    onClick={() => onProduct(p)}
                    onAddOrder={(e) => e.stopPropagation()}
                    onRFQ={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── B2B Category Browse Page ──────────────────────────────────────────────────

function B2BCategoryPage({ catId, b2bUser, onProduct, onBack }: {
  catId: string; b2bUser: B2BUser; onProduct: (p: Product) => void; onBack: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const [brand, setBrand] = useState("All");
  const [subcat, setSubcat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  let products = PRODUCTS.filter((p) =>
    p.cat === catId &&
    (brand === "All" || p.brand === brand) &&
    (subcat === "All" || p.subcat === subcat)
  );
  if (sort === "price-asc") products = [...products].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") products = [...products].sort((a, b) => b.price - a.price);
  else if (sort === "moq") products = [...products].sort((a, b) => getMOQ(a.cat) - getMOQ(b.cat));
  else products = [...products].sort((a, b) => b.reviews - a.reviews);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="bg-bk-card border-b border-bk-border px-3 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="text-sm font-black text-bk-ink">{cat.icon} {cat.label}</span>
        <span className="text-[10px] text-bk-muted">({products.length} products)</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="text-[10px] font-bold text-bk-muted hover:text-bk-blue border border-bk-border rounded-lg px-2.5 py-1">
            {viewMode === "grid" ? "≡ List" : "⊞ Grid"}
          </button>
        </div>
      </div>

      {/* Subcat chips */}
      <div className="bg-bk-card border-b border-bk-border overflow-x-auto flex-shrink-0">
        <div className="flex px-3 py-2 gap-2">
          {cat.subcats.map((sc) => (
            <button key={sc} onClick={() => setSubcat(sc)} className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all"
              style={subcat === sc ? { background: "#2F7F75", color: "#fff", borderColor: "#2F7F75" } : { background: "#FAF8F3", color: "#6F7A7A", borderColor: "#E3E8E6" }}>
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + brand bar */}
      <div className="bg-bk-card border-b border-bk-border px-3 py-2 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
        <span className="text-[10px] font-black text-bk-ink2 whitespace-nowrap flex-shrink-0">Sort:</span>
        {[["popular", "Popular"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"], ["moq", "MOQ ↑"]].map(([v, l]) => (
          <button key={v} onClick={() => setSort(v)} className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
            style={sort === v ? { background: "#2F7F75", color: "#fff", borderColor: "#2F7F75" } : { background: "transparent", color: "#6F7A7A", borderColor: "#E3E8E6" }}>
            {l}
          </button>
        ))}
        <div className="h-4 w-px bg-bk-border mx-1 flex-shrink-0" />
        {cat.brands.filter((b) => b !== "All").map((b) => (
          <button key={b} onClick={() => setBrand(brand === b ? "All" : b)} className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
            style={brand === b ? { background: "#263238", color: "#fff", borderColor: "#263238" } : { background: "transparent", color: "#6F7A7A", borderColor: "#E3E8E6" }}>
            {b}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-5xl mx-auto px-3 py-3">
          {products.length === 0 ? (
            <div className="text-center py-16 text-bk-muted"><div className="text-4xl mb-3">📦</div><p className="font-bold">No products</p><button onClick={() => { setBrand("All"); setSubcat("All"); }} className="mt-2 text-sm text-bk-blue">Clear filters</button></div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {products.map((p) => (
                <B2BProductCard key={p.id} p={p} b2bUser={b2bUser} onClick={() => onProduct(p)} onAddOrder={(e) => e.stopPropagation()} onRFQ={(e) => e.stopPropagation()} />
              ))}
            </div>
          ) : (
            /* List view — maximum info density */
            <div className="space-y-1.5">
              {products.map((p) => {
                const moq = getMOQ(p.cat);
                const stock = getStock(p);
                const tradePrice = getTierPrice(p.price, b2bUser.buyerType, moq);
                const sellers = getSellers(p);
                return (
                  <div key={p.id} onClick={() => onProduct(p)} className="bg-bk-card border border-bk-border rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:border-bk-teal hover:shadow-sm transition-all">
                    <img src={p.img} alt="" className="w-14 h-14 object-cover rounded-lg bg-bk-mint flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase" style={{ color: "#2F7F75" }}>{p.brand}</p>
                      <p className="text-[11px] font-semibold text-bk-ink leading-tight line-clamp-1">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[9px] text-bk-muted">
                        <span>MOQ: <span className="font-bold text-bk-ink">{moq}</span></span>
                        <span>Pack: <span className="font-bold text-bk-ink">{getPackSize(p.cat)}/box</span></span>
                        <span>Stock: <span className={`font-bold ${stock < 60 ? "text-amber-600" : "text-bk-blue"}`}>{stock}</span></span>
                        <span>{sellers.length} sellers</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {tradePrice !== null ? (
                        <>
                          <p className="text-sm font-black text-bk-ink">{fmt(tradePrice)}<span className="text-[8px] text-bk-muted font-normal">/pc</span></p>
                          <p className="text-[9px] text-bk-muted line-through">{fmt(p.price)}</p>
                        </>
                      ) : (
                        <p className="text-[11px] font-black text-bk-blue">RFQ</p>
                      )}
                      <p className="text-[8px] text-bk-muted mt-0.5">{p.delivery}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── B2B Product Page — trade-first ────────────────────────────────────────────

function B2BProductPage({ p, b2bUser, onBack, onAddCart, onRFQ }: {
  p: Product; b2bUser: B2BUser; onBack: () => void;
  onAddCart: (item: B2BCartItem) => void; onRFQ: (p: Product) => void;
}) {
  const [qty, setQty] = useState(getMOQ(p.cat));
  const [uom, setUom] = useState<UOM>("Pcs");
  const [selectedSeller, setSelectedSeller] = useState(0);
  const [tab, setTab] = useState<"pricing" | "sellers" | "specs">("pricing");
  const [addedToast, setAddedToast] = useState(false);
  const moq = getMOQ(p.cat);
  const packSize = getPackSize(p.cat);
  const stock = getStock(p);
  const sellers = getSellers(p);
  const sel = sellers[selectedSeller];
  const tradePrice = getTierPrice(sel.price, b2bUser.buyerType, qty);
  const slabs = getSlabs(sel.price, moq);

  const TRADE_TABLE = [
    { type: "Retail / Walk-in", price: sel.price },
    { type: "Plumber / Contractor", price: Math.round(sel.price * 0.94) },
    { type: "Dealer", price: Math.round(sel.price * 0.89) },
    { type: "Distributor / Bulk", price: null },
  ];

  function handleAdd() {
    if (!tradePrice) return;
    onAddCart({ product: p, qty, uom, sellerIdx: selectedSeller, pricePerUnit: tradePrice });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {addedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] text-white text-xs font-black px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap" style={{ background: "#2F7F75" }}>
          ✓ Added to order — {qty} {uom} @ {fmt(tradePrice!)}
        </div>
      )}

      <div className="bg-bk-card border-b border-bk-border px-3 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: "#2F7F75" }}>{p.brand}</p>
          <p className="text-xs font-semibold text-bk-ink truncate">{p.name}</p>
        </div>
        <Badge label={`${b2bUser.buyerType} rate`} color="#2F7F75" bg="#EEF8F5" />
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-3xl mx-auto">
          {/* Top section: image + key trade data side by side */}
          <div className="bg-bk-card md:flex border-b border-bk-border">
            <div className="md:w-56 md:flex-shrink-0 bg-bk-mint" style={{ minHeight: 200 }}>
              <img src={p.img} alt={p.name} className="w-full h-52 md:h-full object-cover" />
            </div>
            <div className="p-4 flex-1">
              <h1 className="text-sm font-bold text-bk-ink leading-snug mb-3">{p.name}</h1>

              {/* Trade specs grid — most important info first */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { l: "MOQ", v: `${moq} pcs`, hi: false },
                  { l: "Pack", v: `${packSize}/box`, hi: false },
                  { l: "Stock", v: `${stock} pcs`, hi: stock < 60 },
                  { l: "Sellers", v: `${sellers.length}`, hi: false },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl p-2 border border-bk-border text-center" style={{ background: "#FAF8F3" }}>
                    <p className="text-[8px] text-bk-muted uppercase">{s.l}</p>
                    <p className={`text-[11px] font-black mt-0.5 ${s.hi ? "text-amber-600" : "text-bk-ink"}`}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Your price + qty UOM selector */}
              <div className="rounded-xl p-3 border mb-3" style={{ background: "#EEF8F5", borderColor: "#7CCFC166" }}>
                {tradePrice !== null ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-black text-bk-ink">{fmt(tradePrice)}</span>
                      <span className="text-xs text-bk-muted line-through">{fmt(sel.price)}</span>
                      <span className="text-xs font-black" style={{ color: "#2F7F75" }}>{TIER_DISC[b2bUser.buyerType]} off</span>
                    </div>
                    <p className="text-[10px] text-bk-muted">For {qty} {uom} = <span className="font-black text-bk-ink">{fmt(tradePrice * qty)}</span> + GST · {sel.city} · {sel.delivery}</p>
                  </>
                ) : (
                  <p className="text-sm font-black text-bk-blue">Price on Request · Submit RFQ for distributor pricing</p>
                )}
              </div>

              {/* Quantity + UOM */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide">Qty:</span>
                <div className="flex items-center border-2 border-bk-border rounded-xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(moq, qty - (qty > moq * 4 ? 10 : 1)))} className="px-3 py-1.5 font-black text-bk-blue hover:bg-bk-mint text-sm">−</button>
                  <input type="number" value={qty} onChange={(e) => setQty(Math.max(moq, parseInt(e.target.value) || moq))} className="w-16 py-1.5 text-sm font-black text-center border-x border-bk-border outline-none bg-transparent" />
                  <button onClick={() => setQty(qty + (qty >= moq * 4 ? 10 : 1))} className="px-3 py-1.5 font-black text-bk-blue hover:bg-bk-mint text-sm">+</button>
                </div>
                <select value={uom} onChange={(e) => setUom(e.target.value as UOM)} className="border-2 border-bk-border rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-bk-teal bg-white text-bk-ink">
                  {(["Pcs", "Box", "Carton", "Set", "Kg", "Mtr"] as UOM[]).map((u) => <option key={u}>{u}</option>)}
                </select>
                <span className="text-[10px] text-bk-muted">Min {moq} · Pack {packSize}/box</span>
              </div>

              {/* GST note */}
              <p className="text-[9px] text-bk-muted mb-3">HSN: 8481.80 · IGST 18% · {b2bUser.gstin ? `GSTIN: ${b2bUser.gstin}` : "GSTIN not provided"}</p>

              {/* CTAs */}
              <div className="flex gap-2">
                {tradePrice !== null && (
                  <button onClick={handleAdd} className="flex-1 py-3 text-white font-black text-sm rounded-xl shadow hover:opacity-90 transition-opacity" style={{ background: "#2F7F75" }}>
                    Add to Order
                  </button>
                )}
                <button onClick={() => onRFQ(p)} className="flex-1 py-3 font-black text-sm rounded-xl border-2 transition-all hover:text-white"
                  style={{ borderColor: "#2F7F75", color: "#2F7F75" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "#2F7F75"; el.style.color = "#fff"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "#2F7F75"; }}>
                  Request Best Price
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-bk-card mt-2">
            <div className="flex border-b border-bk-border">
              {(["pricing", "sellers", "specs"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${tab === t ? "text-bk-blue border-bk-teal" : "text-bk-muted border-transparent"}`}>
                  {t === "pricing" ? "Qty Pricing" : t === "sellers" ? `${sellers.length} Sellers` : "Specifications"}
                </button>
              ))}
            </div>
            <div className="p-4">
              {tab === "pricing" && (
                <div className="space-y-4">
                  {/* Volume slabs */}
                  <div>
                    <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Volume Pricing — {sel.name}</p>
                    <div className="rounded-xl overflow-hidden border border-bk-border">
                      <div className="grid px-3 py-2 bg-bk-mint text-[9px] font-black text-bk-ink2 uppercase tracking-wide" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                        <span>Quantity Range</span><span>Price/pc</span><span>Saving</span><span>Total</span>
                      </div>
                      {slabs.map((s, i) => {
                        const myQty = qty;
                        const thisMax = i === 0 ? moq * 4 - 1 : i === 1 ? moq * 20 - 1 : 9999;
                        const thisMin = i === 0 ? moq : i === 1 ? moq * 4 : moq * 20;
                        const active = myQty >= thisMin && myQty <= thisMax;
                        return (
                          <div key={i} className={`grid px-3 py-2.5 border-t border-bk-border text-xs items-center ${active ? "bg-bk-mint" : ""}`} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                            <span className="font-semibold text-bk-ink flex items-center gap-1.5">
                              {s.label} {active && <span className="text-[8px] font-black px-1 py-0.5 rounded text-white" style={{ background: "#2F7F75" }}>Your qty</span>}
                            </span>
                            <span className="font-black text-bk-ink">{fmt(s.price)}</span>
                            <span className="font-bold" style={{ color: s.tag ? "#2F7F75" : "#6F7A7A" }}>{s.tag || "—"}</span>
                            <span className="font-bold text-bk-ink">{fmt(s.price * (active ? qty : thisMin))}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trade price table */}
                  <div>
                    <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Trade Price Table</p>
                    <div className="rounded-xl overflow-hidden border border-bk-border">
                      <div className="grid px-3 py-2 bg-bk-mint text-[9px] font-black text-bk-ink2 uppercase tracking-wide grid-cols-2">
                        <span>Buyer Type</span><span className="text-right">Price/piece</span>
                      </div>
                      {TRADE_TABLE.map((row, i) => {
                        const isMe = i === 1 && ["Contractor", "Plumber", "Electrician", "Builder", "Farmer"].includes(b2bUser.buyerType)
                          || i === 2 && b2bUser.buyerType === "Dealer"
                          || i === 3 && b2bUser.buyerType === "Distributor"
                          || i === 0 && b2bUser.buyerType === "Retailer";
                        return (
                          <div key={i} className={`grid grid-cols-2 px-3 py-2.5 border-t border-bk-border text-xs ${isMe ? "bg-bk-mint" : ""}`}>
                            <span className="font-semibold text-bk-ink flex items-center gap-1">
                              {row.type}
                              {isMe && <span className="text-[8px] font-black text-bk-blue border border-bk-teal/50 bg-white rounded px-1">You</span>}
                            </span>
                            <span className="text-right font-black">
                              {row.price !== null ? <span className={isMe ? "text-bk-blue" : "text-bk-ink"}>{fmt(row.price)}</span> : <span className="text-bk-blue font-bold">Request Quote</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[10px] text-bk-ink2 space-y-0.5 border border-bk-border rounded-xl p-3 bg-bk-surface">
                    <p>📦 Pack size: {packSize} pcs/carton · Minimum order: {moq} pcs</p>
                    <p>🚚 {sel.delivery} from {sel.city} · Free delivery above ₹5,000</p>
                    <p>📄 Tax invoice with HSN & GSTIN on order confirmation</p>
                  </div>
                </div>
              )}

              {tab === "sellers" && (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide">{sellers.length} sellers available</p>
                  {sellers.map((s, i) => (
                    <div key={i} onClick={() => setSelectedSeller(i)} className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${selectedSeller === i ? "border-bk-teal" : "border-bk-border hover:border-bk-teal"}`}>
                      <div className={`flex items-center justify-between px-3 py-2 ${selectedSeller === i ? "bg-bk-mint" : "bg-bk-surface"}`}>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-bk-ink">{s.name}</p>
                          {s.kyc && <Badge label="✓ KYC" color="#2F7F75" bg="#EEF8F5" />}
                          {s.gst && <Badge label="GST" color="#4A7FB8" bg="#EAF3FD" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <MiniStars r={s.rating} />
                          {selectedSeller === i && <span className="text-[9px] font-black text-bk-blue">Selected</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 divide-x divide-bk-border border-t border-bk-border">
                        {[
                          ["Price/pc", fmt(s.price), false],
                          ["MOQ", `${s.moq} pcs`, false],
                          ["Stock", `${s.stock}`, s.stock < 60],
                          ["Delivery", s.delivery, false],
                          ["Credit", s.credit, false],
                        ].map(([l, v, warn]) => (
                          <div key={String(l)} className="px-2 py-2 text-center">
                            <p className="text-[8px] text-bk-muted uppercase">{l}</p>
                            <p className={`text-[10px] font-bold mt-0.5 ${warn ? "text-amber-600" : "text-bk-ink"}`}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "specs" && (
                <div className="divide-y divide-bk-border">
                  {p.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5">
                      <span className="font-bold text-sm mt-0.5" style={{ color: "#2F7F75" }}>✓</span>
                      <span className="text-xs text-bk-ink2">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-24 md:h-4" />
        </div>
      </div>

      {/* Sticky CTAs — mobile */}
      <div className="md:hidden bg-bk-card border-t border-bk-border px-4 py-3 flex gap-2 flex-shrink-0">
        <button onClick={() => onRFQ(p)} className="flex-1 py-3.5 rounded-xl text-sm font-black border-2" style={{ borderColor: "#2F7F75", color: "#2F7F75" }}>Get Best Price</button>
        {tradePrice !== null && (
          <button onClick={handleAdd} className="flex-1 py-3.5 rounded-xl text-white text-sm font-black shadow-md" style={{ background: "#2F7F75" }}>Add to Order</button>
        )}
      </div>
    </div>
  );
}

// ── RFQ Overlay ───────────────────────────────────────────────────────────────

function RFQOverlay({ product, b2bUser, onClose, onSubmit }: { product: Product | null; b2bUser: B2BUser; onClose: () => void; onSubmit: () => void }) {
  const [qty, setQty] = useState(product ? getMOQ(product.cat) * 5 : 10);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit() { setSubmitted(true); setTimeout(onSubmit, 1800); }

  if (submitted) return (
    <div className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center px-6">
      <div className="bg-bk-card rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-lg font-black text-bk-ink">RFQ Submitted!</h2>
        <p className="text-xs text-bk-muted mt-1">Sellers respond in 2–4 hours via WhatsApp & portal</p>
        <p className="text-xs font-black text-bk-blue mt-2">RFQ-{Date.now().toString().slice(-4)}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-bk-card w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-bk-ink">Request Best Price</h2>
            {product && <p className="text-[10px] text-bk-muted truncate max-w-[240px]">{product.brand} · {product.name}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-bk-surface flex items-center justify-center text-bk-muted">✕</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-bk-ink2 uppercase mb-1.5">Required Qty</label>
              <div className="flex items-center border-2 border-bk-border rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 5))} className="px-3 py-2 font-black text-bk-blue">−</button>
                <span className="flex-1 text-center py-2 font-black text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 5)} className="px-3 py-2 font-black text-bk-blue">+</button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-bk-ink2 uppercase mb-1.5">Delivery City</label>
              <input defaultValue={b2bUser.city} className="w-full border-2 border-bk-border rounded-xl px-3 py-2 text-sm outline-none focus:border-bk-teal" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-bk-ink2 uppercase mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brand preference, delivery date, site address…" rows={2} className="w-full border-2 border-bk-border rounded-xl px-3 py-2 text-sm outline-none focus:border-bk-teal resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setUrgent(!urgent)} className={`w-10 h-5 rounded-full relative transition-colors ${urgent ? "bg-bk-teal" : "bg-bk-border"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${urgent ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-xs font-semibold text-bk-ink2">Urgent (within 24 hrs)</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-bk-border text-xs font-bold text-bk-muted">Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl text-white text-sm font-black shadow-md hover:opacity-90" style={{ background: "#2F7F75" }}>Submit RFQ →</button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Material List ────────────────────────────────────────────────────────

function BulkListPage({ b2bUser, onBack }: { b2bUser: B2BUser; onBack: () => void }) {
  const [rows, setRows] = useState([
    { sku: "SS304-BIB-15", name: "SS Bib Cock 15mm", qty: 40, unit: "Pcs" },
    { sku: "BASIN-CER-450", name: "Ceramic Basin 450mm", qty: 12, unit: "Pcs" },
    { sku: "WC-COMBO-WHITE", name: "WC Combo White", qty: 8, unit: "Nos" },
    { sku: "PVC-ELBOW-25", name: "PVC Elbow 25mm", qty: 100, unit: "Pcs" },
    { sku: "", name: "", qty: 1, unit: "Pcs" },
  ]);
  const [submitted, setSubmitted] = useState(false);

  function updateRow(i: number, field: string, val: string | number) {
    const next = [...rows]; (next[i] as Record<string, string | number>)[field] = val; setRows(next);
  }

  if (submitted) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">📤</div>
      <h2 className="text-xl font-black text-bk-ink">Bulk RFQ Sent!</h2>
      <p className="text-sm text-bk-muted mt-2 max-w-sm">Distributed to {rows.filter((r) => r.sku || r.name).length > 3 ? "12" : "8"} verified sellers. Quotes expected in 2–4 hours via WhatsApp and portal.</p>
      <div className="bg-bk-card rounded-2xl p-4 mt-5 border border-bk-border text-left w-full max-w-sm">
        {rows.filter((r) => r.sku || r.name).map((r, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-bk-border last:border-0 text-xs">
            <span className="text-bk-ink font-semibold">{r.name || r.sku}</span>
            <span className="text-bk-muted font-bold">{r.qty} {r.unit}</span>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="mt-6 px-8 py-3.5 text-white font-black text-sm rounded-2xl shadow" style={{ background: "#2F7F75" }}>Back to Trade Portal</button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-bk-card border-b border-bk-border px-3 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="text-sm font-black text-bk-ink flex-1">Bulk Material List / BOQ</span>
        <span className="text-[10px] text-bk-muted">{rows.filter((r) => r.sku || r.name).length} items</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-2xl mx-auto px-3 py-4">
          <div className="bg-bk-mint rounded-xl px-4 py-3 border border-bk-border mb-4 text-xs">
            <p className="font-black text-bk-blue mb-0.5">How it works</p>
            <p className="text-bk-ink2">Enter your Bill of Quantities. BuildKart distributes the RFQ to verified suppliers and returns competing quotes for your whole list — not item by item.</p>
          </div>
          <div className="bg-bk-card rounded-2xl border border-bk-border overflow-hidden shadow-sm">
            <div className="grid gap-1.5 px-3 py-2 bg-bk-mint border-b border-bk-border text-[9px] font-black text-bk-ink2 uppercase tracking-wide" style={{ gridTemplateColumns: "2fr 3fr 80px 56px 24px" }}>
              <span>SKU / Code</span><span>Product Name</span><span className="text-center">Qty</span><span className="text-center">Unit</span><span />
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid gap-1.5 px-3 py-2 border-b border-bk-border last:border-0 items-center" style={{ gridTemplateColumns: "2fr 3fr 80px 56px 24px" }}>
                <input value={row.sku} onChange={(e) => updateRow(i, "sku", e.target.value)} placeholder="SKU-123" className="border border-bk-border rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none focus:border-bk-teal w-full" />
                <input value={row.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Product name…" className="border border-bk-border rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-bk-teal w-full" />
                <input type="number" value={row.qty} onChange={(e) => updateRow(i, "qty", parseInt(e.target.value) || 1)} min={1} className="border border-bk-border rounded-lg px-2 py-1.5 text-[11px] text-center font-bold outline-none focus:border-bk-teal w-full" />
                <select value={row.unit} onChange={(e) => updateRow(i, "unit", e.target.value)} className="border border-bk-border rounded-lg px-1 py-1.5 text-[10px] outline-none focus:border-bk-teal bg-white w-full">
                  {["Pcs", "Nos", "Set", "Box", "Kg", "Mtr", "Ltr"].map((u) => <option key={u}>{u}</option>)}
                </select>
                <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-bk-muted hover:text-bk-red text-xs font-bold">✕</button>
              </div>
            ))}
            <div className="px-3 py-2 border-t border-bk-border"><button onClick={() => setRows([...rows, { sku: "", name: "", qty: 1, unit: "Pcs" }])} className="text-[10px] font-bold text-bk-blue hover:underline">+ Add row</button></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button className="py-2.5 rounded-xl border-2 border-dashed border-bk-border text-xs font-bold text-bk-muted hover:border-bk-teal hover:text-bk-blue transition-colors">📎 Upload Excel / CSV</button>
            <button className="py-2.5 rounded-xl border-2 border-dashed border-bk-border text-xs font-bold text-bk-muted hover:border-bk-teal hover:text-bk-blue transition-colors">🗒️ Import from Invoice</button>
          </div>
          <button onClick={() => setSubmitted(true)} className="w-full mt-4 py-4 text-white font-black text-sm rounded-2xl shadow-md hover:opacity-90" style={{ background: "#2F7F75" }}>
            📤 Send Bulk RFQ to Sellers →
          </button>
          <p className="text-[10px] text-bk-muted text-center mt-2">Quotes arrive in 2–4 hrs via WhatsApp & portal notifications</p>
        </div>
      </div>
    </div>
  );
}

// ── Quick Order Overlay ───────────────────────────────────────────────────────

function QuickOrderOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"sku" | "reorder">("sku");
  const [rows, setRows] = useState([{ sku: "SS304-BIB-15", qty: 20 }, { sku: "FAN-BLDC-1200", qty: 10 }, { sku: "", qty: 1 }]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-bk-card w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-bk-border">
          <h2 className="text-sm font-black text-bk-ink">⚡ Quick Order</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-bk-surface flex items-center justify-center text-bk-muted text-sm">✕</button>
        </div>
        <div className="flex border-b border-bk-border">
          {(["sku", "reorder"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-[11px] font-bold transition-colors border-b-2 -mb-px ${tab === t ? "text-bk-blue border-bk-teal" : "text-bk-muted border-transparent"}`}>
              {t === "sku" ? "SKU / Code Entry" : "🔄 Repeat Previous"}
            </button>
          ))}
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {tab === "sku" && (
            <div className="space-y-2">
              <p className="text-[10px] text-bk-muted mb-2">Enter product codes + quantities</p>
              {rows.map((r, i) => (
                <div key={i} className="flex gap-1.5">
                  <input value={r.sku} onChange={(e) => { const n = [...rows]; n[i].sku = e.target.value; setRows(n); }} placeholder="Product code or SKU" className="flex-1 border-2 border-bk-border rounded-xl px-3 py-2 text-[11px] font-mono outline-none focus:border-bk-teal" />
                  <input type="number" value={r.qty} onChange={(e) => { const n = [...rows]; n[i].qty = parseInt(e.target.value) || 1; setRows(n); }} className="w-16 border-2 border-bk-border rounded-xl px-2 py-2 text-[11px] text-center font-bold outline-none focus:border-bk-teal" />
                </div>
              ))}
              <button onClick={() => setRows([...rows, { sku: "", qty: 1 }])} className="text-[10px] font-bold text-bk-blue">+ Add row</button>
              <button className="w-full mt-2 py-3 rounded-xl text-white font-black text-sm shadow hover:opacity-90" style={{ background: "#2F7F75" }}>Add All to Order →</button>
            </div>
          )}
          {tab === "reorder" && (
            <div className="space-y-2.5">
              {[
                { id: "BKB-229841", date: "24 Aug", items: "Jaquar BibCock ×20, LED Tube ×12, MCB ×8", total: "₹14,280" },
                { id: "BKB-229712", date: "18 Aug", items: "Asian Paints 20L ×4, Wall Putty ×3", total: "₹8,640" },
              ].map((o) => (
                <div key={o.id} className="rounded-xl border border-bk-border p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-bk-ink">#{o.id} <span className="font-normal text-bk-muted">{o.date}</span></p>
                    <p className="text-[10px] text-bk-muted truncate">{o.items}</p>
                    <p className="text-[10px] font-bold text-bk-ink">{o.total}</p>
                  </div>
                  <button className="flex-shrink-0 py-2 px-3 text-white text-[11px] font-black rounded-xl" style={{ background: "#2F7F75" }}>Reorder</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── B2B Cart ──────────────────────────────────────────────────────────────────

function B2BCart({ items, onRemove, onQty, onCheckout, onBack, b2bUser }: {
  items: B2BCartItem[]; onRemove: (id: number) => void; onQty: (id: number, d: number) => void;
  onCheckout: () => void; onBack: () => void; b2bUser: B2BUser;
}) {
  const [useCredit, setUseCredit] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.pricePerUnit * i.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const creditAvail = b2bUser.creditLimit - b2bUser.creditUsed;

  const sellerGroups = items.reduce((acc, item) => {
    const sellerName = getSellers(item.product)[item.sellerIdx]?.name || "BuildKart Seller";
    if (!acc[sellerName]) acc[sellerName] = [];
    acc[sellerName].push(item);
    return acc;
  }, {} as Record<string, B2BCartItem[]>);

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-4">🧺</div>
      <p className="font-black text-xl text-bk-ink">Order list is empty</p>
      <p className="text-xs text-bk-muted mt-2">Add products or submit a Bulk RFQ</p>
      <button onClick={onBack} className="mt-5 px-8 py-3 text-white font-black rounded-2xl text-sm shadow" style={{ background: "#2F7F75" }}>Browse Trade Catalogue</button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      <div className="max-w-3xl mx-auto px-3 py-4 md:grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 space-y-3">
          {/* MOQ validation banner */}
          <div className="rounded-xl px-3 py-2 flex items-center gap-2 border text-xs" style={{ background: "#EEF8F5", borderColor: "#7CCFC166" }}>
            <span>✓</span><p className="font-bold text-bk-blue">All items meet MOQ requirements · Sub-orders will be split by seller</p>
          </div>

          {Object.entries(sellerGroups).map(([sellerName, sellerItems]) => {
            const sellerTotal = sellerItems.reduce((s, i) => s + i.pricePerUnit * i.qty, 0);
            return (
              <div key={sellerName} className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-bk-mint border-b border-bk-border">
                  <span className="text-sm">🏪</span>
                  <p className="text-xs font-black text-bk-ink">{sellerName}</p>
                  <Badge label="GST ✓" color="#2F7F75" bg="#EEF8F5" />
                  <span className="ml-auto text-[10px] font-bold text-bk-ink">Sub-total: {fmt(sellerTotal)}</span>
                </div>
                {sellerItems.map((item) => (
                  <div key={item.product.id} className="px-4 py-3 border-b border-bk-border last:border-0">
                    <div className="flex gap-3">
                      <img src={item.product.img} alt="" className="w-14 h-14 object-cover rounded-xl bg-bk-mint border border-bk-border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase" style={{ color: "#2F7F75" }}>{item.product.brand}</p>
                        <p className="text-[11px] font-semibold text-bk-ink leading-tight line-clamp-1">{item.product.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[9px] text-bk-muted">
                          <span>MOQ: {getMOQ(item.product.cat)} · Pack: {getPackSize(item.product.cat)}/box</span>
                          <span className="font-bold text-bk-blue">{item.uom}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-bk-border rounded-xl overflow-hidden">
                            <button onClick={() => item.qty > 1 ? onQty(item.product.id, -1) : onRemove(item.product.id)} className="px-2.5 py-1 font-black text-bk-blue text-sm">−</button>
                            <span className="px-3 py-1 text-sm font-black border-x border-bk-border">{item.qty}</span>
                            <button onClick={() => onQty(item.product.id, 1)} className="px-2.5 py-1 font-black text-bk-blue text-sm">+</button>
                          </div>
                          <span className="text-sm font-black text-bk-ink">{fmt(item.pricePerUnit * item.qty)}</span>
                          <span className="text-[9px] text-bk-muted">+ GST</span>
                          <button onClick={() => onRemove(item.product.id)} className="ml-auto text-[10px] font-bold text-bk-muted hover:text-bk-red">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* GST details */}
          <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
            <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">GST & Business Details</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-bk-ink2">
              <div><p className="text-bk-muted text-[9px] uppercase">Business</p><p className="font-bold text-bk-ink">{b2bUser.businessName}</p></div>
              <div><p className="text-bk-muted text-[9px] uppercase">GSTIN</p><p className="font-bold font-mono text-bk-ink">{b2bUser.gstin || "Not provided"}</p></div>
              <div><p className="text-bk-muted text-[9px] uppercase">Buyer Type</p><p className="font-bold text-bk-ink">{b2bUser.buyerType}</p></div>
              <div><p className="text-bk-muted text-[9px] uppercase">Payment Terms</p><p className="font-bold text-bk-ink">{b2bUser.paymentTerms}</p></div>
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="md:col-span-1 mt-3 md:mt-0">
          <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm sticky top-4">
            <p className="text-xs font-black text-bk-ink mb-3">Order Summary</p>
            <div className="space-y-2 text-xs text-bk-ink2">
              <div className="flex justify-between"><span>Taxable Value</span><span className="font-bold">{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span>CGST (9%)</span><span className="font-bold">{fmt(Math.round(gst / 2))}</span></div>
              <div className="flex justify-between"><span>SGST (9%)</span><span className="font-bold">{fmt(Math.round(gst / 2))}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-bold text-bk-blue">FREE</span></div>
              <div className="border-t border-bk-border pt-2 flex justify-between text-sm font-black text-bk-ink"><span>Invoice Total</span><span>{fmt(total)}</span></div>
            </div>
            {creditAvail > 0 && (
              <div className="mt-3 rounded-xl p-3 border border-bk-border bg-bk-surface">
                <label className="flex items-start gap-2 cursor-pointer">
                  <div onClick={() => setUseCredit(!useCredit)} className={`mt-0.5 w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${useCredit ? "bg-bk-teal" : "bg-bk-border"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${useCredit ? "left-4" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-bk-ink">Use Credit Account</p>
                    <p className="text-[9px] text-bk-muted">Available: {fmt(creditAvail)} · {b2bUser.paymentTerms}</p>
                  </div>
                </label>
              </div>
            )}
            <button onClick={onCheckout} className="w-full mt-4 py-3.5 text-white font-black text-sm rounded-2xl shadow hover:opacity-90" style={{ background: "#2F7F75" }}>
              Proceed to Checkout →
            </button>
            <p className="text-[9px] text-bk-muted text-center mt-2">Tax invoice generated on order confirmation</p>
          </div>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}

// ── B2B Checkout ──────────────────────────────────────────────────────────────

function B2BCheckout({ items, b2bUser, onConfirm, onBack }: {
  items: B2BCartItem[]; b2bUser: B2BUser; onConfirm: (id: string) => void; onBack: () => void;
}) {
  const [pay, setPay] = useState<"credit" | "upi" | "bank" | "partial">("credit");
  const [poRef, setPoRef] = useState("");
  const [placing, setPlacing] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.pricePerUnit * i.qty, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const creditAvail = b2bUser.creditLimit - b2bUser.creditUsed;

  const PAY_OPTIONS = [
    { id: "credit" as const, icon: "🏦", label: "Business Credit Account", sub: `${b2bUser.paymentTerms} · ${fmt(creditAvail)} available`, ok: creditAvail >= total },
    { id: "upi" as const, icon: "🟣", label: "UPI / QR Payment", sub: "GPay · PhonePe · Paytm · BHIM", ok: true },
    { id: "bank" as const, icon: "🏛️", label: "Bank Transfer / RTGS", sub: "NEFT · RTGS · IMPS — upload reference", ok: true },
    { id: "partial" as const, icon: "📊", label: "Partial Payment", sub: "Advance now · Balance on delivery", ok: true },
  ];

  function place() { setPlacing(true); setTimeout(() => onConfirm("BKB" + Date.now().toString().slice(-6)), 2000); }

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      <div className="bg-bk-card border-b border-bk-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="text-sm font-black text-bk-ink flex-1">B2B Checkout</span>
        <Badge label="GST Tax Invoice" color="#2F7F75" bg="#EEF8F5" />
      </div>
      <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
        {/* Delivery */}
        <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
          <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Delivery Address</p>
          <p className="text-sm font-bold text-bk-ink">{b2bUser.businessName}</p>
          <p className="text-xs text-bk-muted mt-0.5">Plot 12, Industrial Area Phase 2, {b2bUser.city}</p>
          <div className="flex gap-2 mt-2">
            {["Business Address", "Site Delivery", "Warehouse Pickup"].map((t, i) => (
              <button key={t} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${i === 0 ? "border-bk-teal text-bk-blue bg-bk-mint" : "border-bk-border text-bk-muted"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* PO Reference */}
        <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
          <label className="block text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-1.5">PO / Reference Number <span className="text-bk-muted font-normal normal-case">(optional)</span></label>
          <input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="Your internal PO number e.g. PO/2026/0234" className="w-full border-2 border-bk-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-bk-teal font-mono" />
          <p className="text-[10px] text-bk-muted mt-1">Printed on tax invoice for easy reconciliation</p>
        </div>

        {/* Payment */}
        <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
          <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Payment Method</p>
          <div className="space-y-2">
            {PAY_OPTIONS.map((m) => (
              <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${!m.ok ? "opacity-40 cursor-not-allowed" : pay === m.id ? "border-bk-teal bg-bk-mint" : "border-bk-border hover:border-bk-teal"}`}>
                <input type="radio" name="pay" checked={pay === m.id} onChange={() => m.ok && setPay(m.id)} disabled={!m.ok} className="accent-bk-blue" />
                <span className="text-lg">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-bk-ink">{m.label}</p>
                  <p className="text-[10px] text-bk-muted">{m.sub}</p>
                </div>
                {m.id === "credit" && m.ok && <Badge label="Approved" color="#2F7F75" bg="#EEF8F5" />}
              </label>
            ))}
          </div>
          {pay === "bank" && (
            <div className="mt-3 p-3 bg-bk-mint rounded-xl border border-bk-border text-xs">
              <p className="font-black text-bk-ink mb-1">Transfer to:</p>
              <p className="text-bk-ink2">BuildKart Payments Pvt Ltd · HDFC Bank</p>
              <p className="text-bk-ink2 font-mono">IFSC: HDFC0001234 · A/C: 50200987654</p>
              <button className="mt-2 text-bk-blue font-bold hover:underline text-[10px]">📎 Upload Payment Reference</button>
            </div>
          )}
          {pay === "partial" && (
            <div className="mt-3 p-3 bg-bk-mint rounded-xl border border-bk-border text-xs">
              <div className="flex justify-between mb-1"><span className="font-bold text-bk-ink">Advance (30%)</span><span className="font-black">{fmt(Math.round(total * 0.3))}</span></div>
              <div className="flex justify-between"><span className="font-bold text-bk-ink">Balance on delivery</span><span className="font-black">{fmt(Math.round(total * 0.7))}</span></div>
            </div>
          )}
        </div>

        {/* GST Invoice summary */}
        <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
          <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Tax Invoice Summary</p>
          <div className="space-y-1.5 text-xs text-bk-ink2">
            {[["Taxable Value", fmt(subtotal)], ["CGST @9%", fmt(Math.round(gst / 2))], ["SGST @9%", fmt(Math.round(gst / 2))], ["Freight", "FREE"]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span>{l}</span><span className="font-bold">{v}</span></div>
            ))}
            <div className="border-t border-bk-border pt-2 flex justify-between text-sm font-black text-bk-ink"><span>Invoice Total</span><span>{fmt(total)}</span></div>
          </div>
          <div className="mt-3 p-2.5 bg-bk-mint rounded-xl border border-bk-border text-[10px]">
            <span className="font-bold text-bk-ink">Buyer GSTIN: </span><span className="font-mono">{b2bUser.gstin || "Not provided"}</span>
            <span className="mx-2 text-bk-border">|</span>
            <span className="font-bold text-bk-ink">{b2bUser.businessName}</span>
          </div>
        </div>

        <button onClick={place} disabled={placing} className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all ${placing ? "opacity-60 cursor-wait" : "hover:opacity-90"}`} style={{ background: placing ? "#666" : "#2F7F75" }}>
          {placing ? "⏳ Placing B2B Order…" : `Place Order — ${fmt(total)}`}
        </button>
        <p className="text-[9px] text-bk-muted text-center pb-4">Tax invoice, delivery challan & tracking generated automatically</p>
      </div>
    </div>
  );
}

// ── Order Confirm ─────────────────────────────────────────────────────────────

function B2BConfirm({ orderId, onHome }: { orderId: string; onHome: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);
  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface flex flex-col items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="bg-bk-card rounded-3xl p-8 shadow-xl border border-bk-border text-center mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow animate-bounce" style={{ background: "#EEF8F5" }}>🎊</div>
          <h1 className="text-2xl font-black text-bk-ink">B2B Order Confirmed!</h1>
          <p className="text-sm text-bk-muted mt-1">Tax invoice being generated and emailed</p>
          <div className="bg-bk-surface rounded-2xl px-5 py-3 mt-4 border border-bk-border inline-block">
            <p className="text-[10px] text-bk-muted uppercase">Order ID</p>
            <p className="text-base font-black text-bk-blue">#{orderId}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4 text-left">
            {[["📄 Tax Invoice", "Auto-generated · GST compliant"], ["📋 Delivery Challan", "On dispatch from seller"], ["💬 WhatsApp Update", "Order & tracking alerts"], ["🧾 Credit Note", "If applicable on return"]].map(([t, s]) => (
              <div key={t} className="bg-bk-surface rounded-xl p-2.5 border border-bk-border">
                <p className="text-[10px] font-black text-bk-ink">{t}</p>
                <p className="text-[9px] text-bk-muted mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onHome} className="w-full py-4 text-white font-black text-sm rounded-2xl shadow hover:opacity-90" style={{ background: "#2F7F75" }}>🏢 Back to Trade Portal</button>
      </div>
    </div>
  );
}

// ── Quotations Page ───────────────────────────────────────────────────────────

function QuotationsPage({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("RFQ-2841");

  const QUOTES = [
    {
      id: "RFQ-2841", date: "26 Aug", status: "Quoted", expires: "28 Aug",
      items: [{ name: "SS Bib Cock 15mm", qty: 40, unit: "Pcs" }, { name: "Ceramic Basin 450mm", qty: 12, unit: "Pcs" }, { name: "WC Combo White", qty: 8, unit: "Nos" }],
      responses: [
        { seller: "Plumbing World", price: "₹1,84,200", gst: "+18% GST", delivery: "Tomorrow", valid: "28 Aug", moq: "As ordered", rating: 4.7 },
        { seller: "Metro Sanitary", price: "₹1,79,800", gst: "+18% GST", delivery: "2 Days", valid: "27 Aug", moq: "Min 5/item", rating: 4.3 },
        { seller: "Wholesale Hub", price: "₹1,71,500", gst: "+18% GST", delivery: "3–4 Days", valid: "29 Aug", moq: "Min 20/item", rating: 4.1 },
      ],
    },
    {
      id: "RFQ-2839", date: "25 Aug", status: "Pending", expires: "27 Aug",
      items: [{ name: "BLDC Ceiling Fan 1200mm", qty: 15, unit: "Pcs" }, { name: "LED Strip 5m Roll", qty: 6, unit: "Nos" }],
      responses: [],
    },
    {
      id: "RFQ-2821", date: "19 Aug", status: "Accepted", expires: "Closed",
      items: [{ name: "Asian Paints Apex 20L", qty: 8, unit: "Cans" }],
      responses: [{ seller: "Paint Palace", price: "₹32,400", gst: "+18% GST", delivery: "Tomorrow", valid: "Accepted", moq: "As ordered", rating: 4.5 }],
    },
  ];

  const sc: Record<string, string> = { Quoted: "#2F7F75", Pending: "#C8934A", Accepted: "#4A7FB8" };

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      <div className="bg-bk-card border-b border-bk-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="text-sm font-black text-bk-ink flex-1">Quotations & RFQs</span>
        <span className="text-[10px] text-bk-muted">{QUOTES.length} total</span>
      </div>
      <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
        {QUOTES.map((q) => (
          <div key={q.id} className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-bk-border bg-bk-surface">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-bk-ink">{q.id}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: sc[q.status] }}>{q.status}</span>
                </div>
                <p className="text-[9px] text-bk-muted">{q.date} · {q.items.length} items · Expires {q.expires}</p>
              </div>
              {q.responses.length > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-bold text-bk-ink">{q.responses.length} quotes</p>
                  <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="text-[9px] font-bold text-bk-blue hover:underline">
                    {expanded === q.id ? "Hide ▲" : "Compare ▼"}
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {q.items.map((item, i) => (
                  <span key={i} className="text-[10px] font-semibold text-bk-ink2 border border-bk-border rounded-full px-2.5 py-1" style={{ background: "#FAF8F3" }}>
                    {item.name} ×{item.qty} {item.unit}
                  </span>
                ))}
              </div>

              {q.status === "Pending" && (
                <p className="text-[11px] text-bk-muted italic">Waiting for seller responses…</p>
              )}

              {q.responses.length > 0 && expanded === q.id && (
                <div className="rounded-xl overflow-hidden border border-bk-border">
                  <div className="grid px-3 py-2 bg-bk-mint text-[9px] font-black text-bk-ink2 uppercase tracking-wide" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 80px" }}>
                    <span>Seller</span><span>Total</span><span>Delivery</span><span>Valid</span><span className="text-center">Action</span>
                  </div>
                  {q.responses.map((r, i) => (
                    <div key={i} className={`grid px-3 py-2.5 border-t border-bk-border text-xs items-center ${i === 2 ? "bg-bk-mint" : ""}`} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 80px" }}>
                      <div>
                        <p className="font-bold text-bk-ink truncate">{r.seller}</p>
                        <p className="text-[9px] text-bk-muted">{r.gst}</p>
                      </div>
                      <div>
                        <p className="font-black text-bk-ink">{r.price}</p>
                        {i === 2 && <p className="text-[9px] font-bold" style={{ color: "#2F7F75" }}>Lowest</p>}
                      </div>
                      <span className="text-bk-muted">{r.delivery}</span>
                      <span className="text-bk-muted">{r.valid}</span>
                      <div className="flex flex-col gap-1">
                        <button className="py-1 px-2 text-[9px] font-black text-white rounded-lg hover:opacity-90" style={{ background: "#2F7F75" }}>Accept</button>
                        <button className="py-1 px-2 text-[9px] font-bold text-bk-blue border border-bk-teal/40 rounded-lg hover:bg-bk-mint">Counter</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="pb-6" />
      </div>
    </div>
  );
}

// ── Business Dashboard ────────────────────────────────────────────────────────

function B2BDashboard({ b2bUser, onBack, onQuotations, onCredit }: { b2bUser: B2BUser; onBack: () => void; onQuotations: () => void; onCredit: () => void }) {
  const creditPct = Math.round((b2bUser.creditUsed / b2bUser.creditLimit) * 100);
  const creditAvail = b2bUser.creditLimit - b2bUser.creditUsed;

  const ORDERS = [
    { id: "BKB-229841", date: "24 Aug", items: "Havells BLDC Fan ×5, Jaquar BibCock ×20", total: "₹28,450", status: "In Transit", sc: "#C8934A" },
    { id: "BKB-229712", date: "18 Aug", items: "Asian Paints 20L ×8, Pidilite DrFixit ×4", total: "₹15,680", status: "Delivered", sc: "#2F7F75" },
    { id: "BKB-229540", date: "10 Aug", items: "Bosch GSB Drill ×2, Kirloskar Pump ×1", total: "₹22,100", status: "Delivered", sc: "#2F7F75" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      <div className="px-4 py-4 text-white shadow-sm" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/70 text-xs font-bold mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>Back
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">{b2bUser.buyerType} · Trade Account</p>
              <h1 className="text-lg font-black text-white mt-0.5">{b2bUser.businessName}</h1>
              <p className="text-white/60 text-[10px]">{b2bUser.name} · {b2bUser.city} · {b2bUser.gstin || "GSTIN not verified"}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-2 text-center flex-shrink-0 border border-white/20">
              <p className="text-white font-black text-base leading-none">{TIER_DISC[b2bUser.buyerType]}</p>
              <p className="text-white/60 text-[9px]">trade disc</p>
            </div>
          </div>

          {/* Credit card — tappable → credit menu */}
          <div onClick={onCredit} className="mt-4 bg-white/12 rounded-2xl p-4 border border-white/15 cursor-pointer hover:bg-white/20 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-white/60 text-[9px] uppercase">Credit Account</p>
                <p className="text-white font-black text-xl">{fmt(b2bUser.creditLimit)} limit</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[9px]">Outstanding</p>
                <p className="text-white font-black text-base">{fmt(b2bUser.creditUsed)}</p>
                <p className="text-white/60 text-[9px]">Due: 15 Sep · {b2bUser.paymentTerms}</p>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full transition-all" style={{ width: `${creditPct}%`, background: creditPct > 70 ? "#F6C6A8" : "rgba(255,255,255,0.85)" }} />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-white/60">Used: {fmt(b2bUser.creditUsed)} ({creditPct}%)</span>
              <span className="text-white font-bold">Available: {fmt(creditAvail)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { icon: "📦", val: "12", label: "Orders", sub: "Aug 2026" },
            { icon: "📋", val: "3", label: "Active RFQs", sub: "2 quoted" },
            { icon: "⏳", val: fmt(b2bUser.creditUsed), label: "Outstanding", sub: "Due 15 Sep" },
            { icon: "📈", val: "₹18.4L", label: "Total Purchases", sub: "This year" },
          ].map((s) => (
            <div key={s.label} className="bg-bk-card rounded-2xl border border-bk-border p-3 shadow-sm">
              <span className="text-xl">{s.icon}</span>
              <p className="text-base font-black text-bk-ink mt-1">{s.val}</p>
              <p className="text-[10px] font-bold text-bk-ink2 leading-tight">{s.label}</p>
              <p className="text-[9px] text-bk-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[["📄", "Download Invoices", "Last 90 days"], ["📋", "View Quotations", "3 active"], ["🔄", "Repeat Last Order", "BKB-229841"]].map(([ic, lbl, sub]) => (
            <button key={lbl} onClick={lbl.includes("Quotation") ? onQuotations : undefined} className="bg-bk-card rounded-xl border border-bk-border p-3 text-left hover:border-bk-teal transition-all">
              <span className="text-xl">{ic}</span>
              <p className="text-[10px] font-black text-bk-ink mt-1 leading-tight">{lbl}</p>
              <p className="text-[9px] text-bk-muted">{sub}</p>
            </button>
          ))}
        </div>

        {/* Orders table */}
        <div className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-bk-border bg-bk-mint">
            <p className="text-[10px] font-black text-bk-ink uppercase tracking-wide">Recent B2B Orders</p>
          </div>
          {ORDERS.map((o) => (
            <div key={o.id} className="px-4 py-3 border-b border-bk-border last:border-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-[11px] font-black text-bk-ink">#{o.id} <span className="font-normal text-bk-muted text-[10px]">{o.date}</span></p>
                  <p className="text-[10px] text-bk-ink2 mt-0.5 line-clamp-1">{o.items}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-bk-ink">{o.total}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: o.sc }}>{o.status}</span>
                </div>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button className="text-[9px] font-bold border rounded-lg px-2 py-1 text-bk-blue border-bk-teal/40 hover:bg-bk-mint">Track</button>
                <button className="text-[9px] font-bold border rounded-lg px-2 py-1 text-bk-muted border-bk-border">Invoice</button>
                <button className="text-[9px] font-bold border rounded-lg px-2 py-1 text-bk-muted border-bk-border">Reorder</button>
                {o.status === "Delivered" && <button className="text-[9px] font-bold border rounded-lg px-2 py-1 border-bk-border text-bk-muted">Return / Claim</button>}
              </div>
            </div>
          ))}
        </div>

        {/* Business users */}
        <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm mb-6">
          <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Business Users & Roles</p>
          {[
            { name: b2bUser.name, role: "Owner · Admin", can: "Full access" },
            { name: "Sunita Devi", role: "Purchase Manager", can: "Order up to ₹50,000" },
            { name: "Anil Kumar", role: "Site Manager", can: "View & track only" },
          ].map((u) => (
            <div key={u.name} className="flex items-center gap-3 py-2.5 border-b border-bk-border last:border-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0" style={{ background: "#2F7F75" }}>{u.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-bk-ink">{u.name}</p>
                <p className="text-[9px] text-bk-muted">{u.role} · {u.can}</p>
              </div>
            </div>
          ))}
          <button className="mt-2 text-[10px] font-bold text-bk-blue hover:underline">+ Add User / Set Approval Workflow</button>
        </div>
      </div>
    </div>
  );
}

// ── Credit Menu ───────────────────────────────────────────────────────────────

const OUTSTANDING_INVOICES = [
  { id: "INV-20240815", seller: "Plumbing World", amount: 75000, due: "15 Sep", age: 12, status: "Current" },
  { id: "INV-20240802", seller: "Metro Trade Co.", amount: 48500, due: "02 Sep", age: 26, status: "Current" },
  { id: "INV-20240721", seller: "Wholesale Hub Pvt", amount: 32200, due: "21 Aug", age: 38, status: "Overdue" },
  { id: "INV-20240710", seller: "Electrical Mart", amount: 18900, due: "10 Aug", age: 49, status: "Overdue", interest: 378 },
  { id: "INV-20240625", seller: "Paint Palace", amount: 8600, due: "25 Jul", age: 64, status: "Past Due", interest: 688 },
];

const CREDIT_TRANSACTIONS = [
  { date: "24 Aug", type: "Purchase", ref: "BKB-229841", amount: 28450, mode: "Credit", balance: 65000 },
  { date: "22 Aug", type: "Payment", ref: "NEFT-88412", amount: -35000, mode: "NEFT", balance: 36550 },
  { date: "18 Aug", type: "Purchase", ref: "BKB-229712", amount: 15680, mode: "Credit", balance: 71550 },
  { date: "15 Aug", type: "Payment", ref: "UPI-71293", amount: -25000, mode: "UPI", balance: 55870 },
  { date: "10 Aug", type: "Purchase", ref: "BKB-229540", amount: 22100, mode: "Credit", balance: 80870 },
  { date: "05 Aug", type: "Settlement", ref: "SETTLE-102", amount: -58770, mode: "NEFT", balance: 58770 },
];

function CreditMenu({ b2bUser, onBack }: { b2bUser: B2BUser; onBack: () => void }) {
  const [tab, setTab] = useState<CreditTab>("overview");
  const [payInvoice, setPayInvoice] = useState<string | null>(null);
  const [payMode, setPayMode] = useState("upi");
  const [partPay, setPartPay] = useState(false);
  const [partAmt, setPartAmt] = useState("");
  const [payDone, setPayDone] = useState<string | null>(null);
  const [limitReqSent, setLimitReqSent] = useState(false);
  const [settleSel, setSettleSel] = useState<string | null>(null);
  const [settleDone, setSettleDone] = useState<string | null>(null);

  const creditPct = Math.round((b2bUser.creditUsed / b2bUser.creditLimit) * 100);
  const creditAvail = b2bUser.creditLimit - b2bUser.creditUsed;
  const totalOutstanding = OUTSTANDING_INVOICES.reduce((s, i) => s + i.amount, 0);
  const overdueTotal = OUTSTANDING_INVOICES.filter((i) => i.status !== "Current").reduce((s, i) => s + i.amount, 0);

  const TABS: Array<{ id: CreditTab; label: string; icon: string }> = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "outstanding", label: "Invoices", icon: "🧾" },
    { id: "paynow", label: "Pay Now", icon: "💸" },
    { id: "limit", label: "Limit", icon: "🏦" },
    { id: "settlement", label: "Early Settle", icon: "⚡" },
    { id: "history", label: "History", icon: "📋" },
    { id: "collections", label: "Reminders", icon: "🔔" },
  ];

  const selInv = OUTSTANDING_INVOICES.find((i) => i.id === payInvoice);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg,#263238,#37474F)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="flex-1">
            <p className="text-white font-black text-sm">Credit Account</p>
            <p className="text-white/50 text-[10px]">{b2bUser.businessName} · {b2bUser.buyerType} · {b2bUser.paymentTerms}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[9px] uppercase">Available</p>
            <p className="text-white font-black text-base">{fmt(creditAvail)}</p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-4 divide-x divide-white/10 border-t border-white/10">
          {[
            { l: "Sanctioned", v: fmt(b2bUser.creditLimit) },
            { l: "Utilized", v: fmt(b2bUser.creditUsed) },
            { l: "Available", v: fmt(creditAvail) },
            { l: "Overdue", v: fmt(overdueTotal) },
          ].map((s) => (
            <div key={s.l} className="px-3 py-2 text-center">
              <p className="text-white/50 text-[8px] uppercase leading-none">{s.l}</p>
              <p className={`text-[11px] font-black mt-0.5 ${s.l === "Overdue" && overdueTotal > 0 ? "text-[#F6C6A8]" : "text-white"}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Utilization bar */}
        <div className="px-4 pb-3">
          <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${creditPct}%`, background: creditPct > 80 ? "#F6C6A8" : creditPct > 50 ? "#F3D38A" : "#7CCFC1" }} />
          </div>
          <div className="flex justify-between mt-0.5 text-[9px] text-white/40">
            <span>0%</span><span className="font-bold text-white/60">{creditPct}% used</span><span>100%</span>
          </div>
        </div>

        {/* Tab row */}
        <div className="flex overflow-x-auto border-t border-white/10">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-[10px] font-bold transition-colors border-b-2 -mb-px ${tab === t.id ? "text-white border-bk-teal" : "text-white/50 border-transparent hover:text-white/80"}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-2xl mx-auto px-3 py-4">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="space-y-3">
              {/* Credit health card */}
              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Credit Health</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 border border-bk-border" style={{ background: "#EEF8F5" }}>
                    <p className="text-[9px] text-bk-muted uppercase">Credit Score</p>
                    <p className="text-xl font-black mt-1" style={{ color: "#2F7F75" }}>742</p>
                    <p className="text-[9px] font-bold text-bk-ink2">Good · Improving ↑</p>
                  </div>
                  <div className="rounded-xl p-3 border border-bk-border bg-bk-surface">
                    <p className="text-[9px] text-bk-muted uppercase">Next Due</p>
                    <p className="text-xl font-black mt-1 text-bk-ink">15 Sep</p>
                    <p className="text-[9px] text-bk-muted">{fmt(75000)} · INV-20240815</p>
                  </div>
                  <div className="rounded-xl p-3 border border-bk-border bg-bk-surface">
                    <p className="text-[9px] text-bk-muted uppercase">Overdue</p>
                    <p className="text-xl font-black mt-1 text-bk-ink" style={overdueTotal > 0 ? { color: "#C87272" } : {}}>{overdueTotal > 0 ? fmt(overdueTotal) : "Nil"}</p>
                    <p className="text-[9px] text-bk-muted">{OUTSTANDING_INVOICES.filter((i) => i.status !== "Current").length} invoices</p>
                  </div>
                  <div className="rounded-xl p-3 border border-bk-border bg-bk-surface">
                    <p className="text-[9px] text-bk-muted uppercase">Total Invoices</p>
                    <p className="text-xl font-black mt-1 text-bk-ink">{OUTSTANDING_INVOICES.length}</p>
                    <p className="text-[9px] text-bk-muted">{fmt(totalOutstanding)} total</p>
                  </div>
                </div>
              </div>

              {/* Ageing summary */}
              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Ageing Summary</p>
                {[
                  { label: "0 – 30 days", color: "#2F7F75", bg: "#EEF8F5", amt: 123500, n: 2 },
                  { label: "31 – 60 days", color: "#C8934A", bg: "#FEF5E7", amt: 51100, n: 2 },
                  { label: "61 + days", color: "#C87272", bg: "#FFF0F0", amt: 8600, n: 1 },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-3 py-2.5 border-b border-bk-border last:border-0">
                    <div className="w-24 text-[10px] font-bold text-bk-ink2">{a.label}</div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full" style={{ background: a.bg }}>
                        <div className="h-2 rounded-full" style={{ background: a.color, width: `${Math.round((a.amt / totalOutstanding) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black" style={{ color: a.color }}>{fmt(a.amt)}</p>
                      <p className="text-[9px] text-bk-muted">{a.n} inv</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTab("paynow")} className="bg-bk-card rounded-2xl border border-bk-border p-3.5 text-left hover:border-bk-teal transition-all shadow-sm">
                  <p className="text-lg mb-1">💸</p>
                  <p className="text-xs font-black text-bk-ink">Pay Outstanding</p>
                  <p className="text-[10px] text-bk-muted">{fmt(totalOutstanding)} due</p>
                </button>
                <button onClick={() => setTab("settlement")} className="bg-bk-card rounded-2xl border border-bk-border p-3.5 text-left hover:border-bk-teal transition-all shadow-sm">
                  <p className="text-lg mb-1">⚡</p>
                  <p className="text-xs font-black text-bk-ink">Early Settlement</p>
                  <p className="text-[10px] text-bk-muted">Get cash against invoices</p>
                </button>
                <button onClick={() => setTab("limit")} className="bg-bk-card rounded-2xl border border-bk-border p-3.5 text-left hover:border-bk-teal transition-all shadow-sm">
                  <p className="text-lg mb-1">🏦</p>
                  <p className="text-xs font-black text-bk-ink">Request Limit Increase</p>
                  <p className="text-[10px] text-bk-muted">{fmt(b2bUser.creditLimit)} sanctioned</p>
                </button>
                <button onClick={() => setTab("history")} className="bg-bk-card rounded-2xl border border-bk-border p-3.5 text-left hover:border-bk-teal transition-all shadow-sm">
                  <p className="text-lg mb-1">📋</p>
                  <p className="text-xs font-black text-bk-ink">Transaction History</p>
                  <p className="text-[10px] text-bk-muted">All credits & payments</p>
                </button>
              </div>

              {/* NBFC note */}
              <div className="rounded-xl px-4 py-3 border text-xs flex items-start gap-3" style={{ background: "#EAF3FD", borderColor: "#A9CFF566" }}>
                <span className="text-base flex-shrink-0">🏛️</span>
                <div>
                  <p className="font-black text-bk-ink">Finance / Loan Sanction</p>
                  <p className="text-bk-ink2 mt-0.5">Credit accounts are powered by our partner NBFC. To increase limit or apply for working capital finance, visit the partner portal for KYC & sanction.</p>
                  <button className="mt-1.5 font-bold" style={{ color: "#4A7FB8" }}>Apply for Finance →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Outstanding Invoices ── */}
          {tab === "outstanding" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { l: "Total Due", v: fmt(totalOutstanding), c: "#2F7F75" },
                  { l: "Overdue", v: fmt(overdueTotal), c: overdueTotal > 0 ? "#C87272" : "#2F7F75" },
                  { l: "Interest", v: fmt(OUTSTANDING_INVOICES.reduce((s, i) => s + (i.interest || 0), 0)), c: "#C8934A" },
                ].map((s) => (
                  <div key={s.l} className="bg-bk-card rounded-xl p-3 border border-bk-border text-center shadow-sm">
                    <p className="text-[8px] text-bk-muted uppercase">{s.l}</p>
                    <p className="text-sm font-black mt-0.5" style={{ color: s.c }}>{s.v}</p>
                  </div>
                ))}
              </div>

              {OUTSTANDING_INVOICES.map((inv) => {
                const ageColor = inv.age > 60 ? "#C87272" : inv.age > 30 ? "#C8934A" : "#2F7F75";
                const ageBg = inv.age > 60 ? "#FFF0F0" : inv.age > 30 ? "#FEF5E7" : "#EEF8F5";
                return (
                  <div key={inv.id} className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[10px] font-black text-bk-ink">{inv.id}</p>
                        <p className="text-[9px] text-bk-muted">{inv.seller} · Due {inv.due}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-bk-ink">{fmt(inv.amount)}</p>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ background: ageBg, color: ageColor }}>{inv.age} days · {inv.status}</span>
                      </div>
                    </div>
                    {inv.interest && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px]" style={{ color: "#C87272" }}>
                        <span>⚠️</span><span className="font-bold">Interest accrued: {fmt(inv.interest)}</span>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <button onClick={() => { setPayInvoice(inv.id); setTab("paynow"); }} className="flex-1 py-2 rounded-xl text-white text-[11px] font-black hover:opacity-90 transition-opacity" style={{ background: "#2F7F75" }}>Pay Now</button>
                      <button className="px-3 py-2 rounded-xl border border-bk-border text-[10px] font-bold text-bk-muted hover:text-bk-blue hover:border-bk-teal transition-all">Dispute</button>
                      <button className="px-3 py-2 rounded-xl border border-bk-border text-[10px] font-bold text-bk-muted hover:text-bk-blue hover:border-bk-teal transition-all">Download</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pay Now ── */}
          {tab === "paynow" && (
            <div className="space-y-3">
              {payDone ? (
                <div className="bg-bk-card rounded-2xl border border-bk-border p-8 text-center shadow-sm">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-lg font-black text-bk-ink">Payment Successful!</h2>
                  <p className="text-xs text-bk-muted mt-1">Reference: {payDone}</p>
                  <p className="text-xs text-bk-muted">Credit limit replenished instantly</p>
                  <button onClick={() => { setPayDone(null); setPayInvoice(null); setTab("overview"); }} className="mt-4 px-8 py-3 text-white font-black rounded-2xl text-sm" style={{ background: "#2F7F75" }}>Back to Credit Dashboard</button>
                </div>
              ) : (
                <>
                  <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                    <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Select Invoice to Pay</p>
                    <div className="space-y-2">
                      {OUTSTANDING_INVOICES.map((inv) => (
                        <label key={inv.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payInvoice === inv.id ? "border-bk-teal bg-bk-mint" : "border-bk-border hover:border-bk-teal"}`}>
                          <input type="radio" name="inv" checked={payInvoice === inv.id} onChange={() => setPayInvoice(inv.id)} className="accent-bk-blue" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] font-black text-bk-ink">{inv.id}</p>
                              {inv.status !== "Current" && <span className="text-[8px] font-black px-1 py-0.5 rounded" style={{ background: "#FFF0F0", color: "#C87272" }}>{inv.status}</span>}
                            </div>
                            <p className="text-[9px] text-bk-muted">{inv.seller} · Due {inv.due}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black text-bk-ink">{fmt(inv.amount)}</p>
                            {inv.interest && <p className="text-[9px]" style={{ color: "#C87272" }}>+{fmt(inv.interest)} int</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selInv && (
                    <>
                      <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                        <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Part Payment</p>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <div onClick={() => setPartPay(!partPay)} className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${partPay ? "bg-bk-teal" : "bg-bk-border"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${partPay ? "left-5" : "left-0.5"}`} />
                          </div>
                          <span className="text-xs font-semibold text-bk-ink">Pay partial amount now</span>
                        </label>
                        {partPay && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-bk-muted">₹</span>
                            <input type="number" value={partAmt} onChange={(e) => setPartAmt(e.target.value)} placeholder={String(Math.round(selInv.amount / 2))} className="flex-1 border-2 border-bk-border rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-bk-teal" />
                            <span className="text-[10px] text-bk-muted">of {fmt(selInv.amount)}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                        <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Payment Method</p>
                        {[
                          { id: "upi", icon: "🟣", label: "UPI / QR", sub: "GPay · PhonePe · BHIM" },
                          { id: "netbanking", icon: "🌐", label: "Net Banking", sub: "All major banks" },
                          { id: "neft", icon: "🏛️", label: "NEFT / RTGS", sub: "Upload reference after transfer" },
                        ].map((m) => (
                          <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all mb-1.5 ${payMode === m.id ? "border-bk-teal bg-bk-mint" : "border-bk-border hover:border-bk-teal"}`}>
                            <input type="radio" name="paymode" checked={payMode === m.id} onChange={() => setPayMode(m.id)} className="accent-bk-blue" />
                            <span className="text-base">{m.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-bk-ink">{m.label}</p>
                              <p className="text-[10px] text-bk-muted">{m.sub}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                        <div className="space-y-1.5 text-xs text-bk-ink2 mb-3">
                          <div className="flex justify-between"><span>Invoice amount</span><span className="font-bold">{fmt(selInv.amount)}</span></div>
                          {selInv.interest && <div className="flex justify-between" style={{ color: "#C87272" }}><span>Overdue interest</span><span className="font-bold">+{fmt(selInv.interest)}</span></div>}
                          {partPay && partAmt && <div className="flex justify-between font-black text-bk-blue"><span>Paying now</span><span>{fmt(parseInt(partAmt) || 0)}</span></div>}
                          <div className="border-t border-bk-border pt-1.5 flex justify-between font-black text-sm text-bk-ink">
                            <span>Amount due now</span>
                            <span>{fmt(partPay && partAmt ? parseInt(partAmt) || 0 : selInv.amount + (selInv.interest || 0))}</span>
                          </div>
                        </div>
                        <button onClick={() => setPayDone("REF" + Date.now().toString().slice(-8))} className="w-full py-3.5 text-white font-black text-sm rounded-2xl shadow hover:opacity-90" style={{ background: "#2F7F75" }}>
                          Pay {fmt(partPay && partAmt ? parseInt(partAmt) || 0 : selInv.amount + (selInv.interest || 0))} →
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Credit Limit ── */}
          {tab === "limit" && (
            <div className="space-y-3">
              <div className="bg-bk-card rounded-2xl border border-bk-border p-5 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Current Sanctioned Limit</p>
                <div className="text-center py-4">
                  <p className="text-4xl font-black text-bk-ink">{fmt(b2bUser.creditLimit)}</p>
                  <p className="text-xs text-bk-muted mt-1">Payment terms: {b2bUser.paymentTerms} · {b2bUser.buyerType} account</p>
                </div>
                <div className="h-3 bg-bk-surface rounded-full overflow-hidden border border-bk-border mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${creditPct}%`, background: creditPct > 80 ? "#C87272" : "#2F7F75" }} />
                </div>
                <div className="flex justify-between text-[10px] text-bk-muted">
                  <span>Used: {fmt(b2bUser.creditUsed)} ({creditPct}%)</span>
                  <span className="font-bold text-bk-ink2">Free: {fmt(creditAvail)}</span>
                </div>
              </div>

              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Limit Change History</p>
                {[
                  { date: "01 Jun 2026", event: "Limit increased", from: "₹1.5L", to: fmt(b2bUser.creditLimit), by: "NBFC Auto-review" },
                  { date: "15 Jan 2026", event: "Limit increased", from: "₹1L", to: "₹1.5L", by: "Manual request" },
                  { date: "01 Sep 2025", event: "Account opened", from: "—", to: "₹1L", by: "Onboarding" },
                ].map((h, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-bk-border last:border-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#2F7F75" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-black text-bk-ink">{h.event}</p>
                        <span className="text-[9px] text-bk-muted">{h.from} → <span className="font-bold text-bk-blue">{h.to}</span></span>
                      </div>
                      <p className="text-[9px] text-bk-muted">{h.date} · {h.by}</p>
                    </div>
                  </div>
                ))}
              </div>

              {limitReqSent ? (
                <div className="bg-bk-mint rounded-2xl border border-bk-border p-5 text-center shadow-sm">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="font-black text-bk-ink">Limit Increase Requested</p>
                  <p className="text-xs text-bk-muted mt-1">NBFC will review and respond in 2–3 business days via SMS & WhatsApp</p>
                </div>
              ) : (
                <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                  <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Request Limit Increase</p>
                  <p className="text-xs text-bk-muted mb-3">Provide your requested amount. Our NBFC partner will review based on your payment history and order volume.</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[b2bUser.creditLimit * 1.5, b2bUser.creditLimit * 2, b2bUser.creditLimit * 3].map((amt) => (
                      <button key={amt} className="py-2.5 rounded-xl border border-bk-border text-xs font-bold text-bk-ink hover:border-bk-teal hover:text-bk-blue transition-all" style={{ background: "#FAF8F3" }}>
                        {fmt(amt)}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setLimitReqSent(true)} className="w-full py-3 text-white font-black text-sm rounded-2xl shadow hover:opacity-90" style={{ background: "#2F7F75" }}>
                    Send Request to NBFC Partner →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Early Settlement ── */}
          {tab === "settlement" && (
            <div className="space-y-3">
              <div className="rounded-xl px-4 py-3 border border-bk-border text-xs" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
                <p className="text-white font-black">⚡ Early Settlement</p>
                <p className="text-white/80 mt-0.5">Get cash today against your outstanding buyer invoices. Settlement value = Invoice amount minus discount (typically 1.5–2%).</p>
              </div>

              {settleDone ? (
                <div className="bg-bk-card rounded-2xl border border-bk-border p-8 text-center shadow-sm">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 className="font-black text-lg text-bk-ink">Settled!</h2>
                  <p className="text-xs text-bk-muted mt-1">Partner NBFC will disburse within 4 hours</p>
                  <p className="text-xs font-black text-bk-blue mt-2">REF-{settleDone}</p>
                  <button onClick={() => setSettleDone(null)} className="mt-4 px-8 py-3 text-white font-black rounded-2xl text-sm shadow" style={{ background: "#2F7F75" }}>Done</button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {OUTSTANDING_INVOICES.filter((i) => i.status === "Current").map((inv) => {
                      const settleAmt = Math.round(inv.amount * 0.985);
                      const disc = inv.amount - settleAmt;
                      const isSel = settleSel === inv.id;
                      return (
                        <div key={inv.id} className={`bg-bk-card rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${isSel ? "border-bk-teal" : "border-bk-border"}`}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-[10px] font-black text-bk-ink">{inv.id}</p>
                              <p className="text-[9px] text-bk-muted">{inv.seller} · Due {inv.due}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-bk-ink">{fmt(inv.amount)}</p>
                              <p className="text-[9px] font-bold" style={{ color: "#2F7F75" }}>Get {fmt(settleAmt)} today</p>
                            </div>
                          </div>
                          {isSel && (
                            <div className="px-4 pb-4 border-t border-bk-border pt-3">
                              <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-bk-ink2">
                                <div className="flex justify-between col-span-2"><span>Invoice value</span><span className="font-bold">{fmt(inv.amount)}</span></div>
                                <div className="flex justify-between col-span-2" style={{ color: "#C8934A" }}><span>Settlement discount (1.5%)</span><span className="font-bold">−{fmt(disc)}</span></div>
                                <div className="flex justify-between col-span-2 border-t border-bk-border pt-1.5 text-sm font-black text-bk-ink"><span>Cash today</span><span style={{ color: "#2F7F75" }}>{fmt(settleAmt)}</span></div>
                              </div>
                              <button onClick={() => setSettleDone(Date.now().toString().slice(-6))} className="w-full py-3 text-white font-black text-sm rounded-xl shadow hover:opacity-90" style={{ background: "#2F7F75" }}>
                                Confirm — Get ₹{settleAmt.toLocaleString("en-IN")} Now →
                              </button>
                              <p className="text-[9px] text-bk-muted text-center mt-1.5">Disbursement within 4 hours · Partner NBFC</p>
                            </div>
                          )}
                          {!isSel && (
                            <button onClick={() => setSettleSel(inv.id)} className="w-full border-t border-bk-border py-2 text-[11px] font-black hover:bg-bk-mint transition-colors" style={{ color: "#2F7F75" }}>
                              Get Cash Today →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-bk-muted text-center">Early settlement powered by our partner NBFC. Subject to eligibility.</p>
                </>
              )}
            </div>
          )}

          {/* ── Transaction History ── */}
          {tab === "history" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                {["All", "Purchases", "Payments", "Settlements"].map((f) => (
                  <button key={f} className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all first:border-bk-teal first:bg-bk-mint first:text-bk-blue border-bk-border text-bk-muted">{f}</button>
                ))}
              </div>
              <div className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden">
                <div className="grid px-3 py-2 bg-bk-mint border-b border-bk-border text-[9px] font-black text-bk-ink2 uppercase tracking-wide" style={{ gridTemplateColumns: "64px 1fr 1fr 80px 80px" }}>
                  <span>Date</span><span>Type</span><span>Reference</span><span className="text-right">Amount</span><span className="text-right">Balance</span>
                </div>
                {CREDIT_TRANSACTIONS.map((t, i) => (
                  <div key={i} className="grid px-3 py-2.5 border-b border-bk-border last:border-0 text-xs items-center" style={{ gridTemplateColumns: "64px 1fr 1fr 80px 80px" }}>
                    <span className="text-bk-muted">{t.date}</span>
                    <span className="font-bold text-bk-ink">{t.type}</span>
                    <span className="text-bk-muted font-mono text-[10px]">{t.ref}</span>
                    <span className={`text-right font-black ${t.amount > 0 ? "text-bk-ink" : "text-bk-blue"}`}>{t.amount > 0 ? `+${fmt(t.amount)}` : fmt(Math.abs(t.amount))}</span>
                    <span className="text-right text-bk-ink2 font-semibold">{fmt(t.balance)}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 rounded-xl border border-dashed border-bk-border text-xs font-bold text-bk-muted hover:border-bk-teal hover:text-bk-blue transition-colors">📄 Download Statement (PDF)</button>
            </div>
          )}

          {/* ── Collections / Reminders ── */}
          {tab === "collections" && (
            <div className="space-y-3">
              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Automated Reminders</p>
                {[
                  { event: "7 days before due", channel: "WhatsApp + SMS", status: "Active", color: "#2F7F75" },
                  { event: "1 day before due", channel: "WhatsApp + Call", status: "Active", color: "#2F7F75" },
                  { event: "On due date", channel: "WhatsApp + Email", status: "Active", color: "#2F7F75" },
                  { event: "3 days overdue", channel: "WhatsApp + Call", status: "Active", color: "#C8934A" },
                  { event: "10 days overdue", channel: "Call + Legal Notice", status: "Active", color: "#C87272" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-bk-border last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-bk-ink">{r.event}</p>
                      <p className="text-[9px] text-bk-muted">{r.channel}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: r.color }}>{r.status}</span>
                  </div>
                ))}
              </div>

              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-3">Past-Due Alerts</p>
                {OUTSTANDING_INVOICES.filter((i) => i.status !== "Current").map((inv) => (
                  <div key={inv.id} className="flex items-start gap-3 py-2.5 border-b border-bk-border last:border-0">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-bk-ink">{inv.id} · {inv.seller}</p>
                      <p className="text-[9px] text-bk-muted">Due {inv.due} · {inv.age} days overdue · {inv.status}</p>
                      {inv.interest && <p className="text-[9px] font-bold" style={{ color: "#C87272" }}>Interest: {fmt(inv.interest)}</p>}
                    </div>
                    <button onClick={() => { setPayInvoice(inv.id); setTab("paynow"); }} className="flex-shrink-0 text-[9px] font-black px-2 py-1 rounded-lg text-white" style={{ background: "#C87272" }}>Pay</button>
                  </div>
                ))}
              </div>

              <div className="bg-bk-card rounded-2xl border border-bk-border p-4 shadow-sm">
                <p className="text-[10px] font-black text-bk-ink2 uppercase tracking-wide mb-2">Manual Follow-up Notes</p>
                <div className="py-6 text-center text-bk-muted">
                  <p className="text-2xl mb-1">📝</p>
                  <p className="text-xs">No manual notes. All follow-ups automated.</p>
                </div>
                <button className="w-full py-2 rounded-xl border border-dashed border-bk-border text-[10px] font-bold text-bk-muted hover:border-bk-teal hover:text-bk-blue transition-colors">+ Add Collection Note</button>
              </div>
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

// ── B2B Header ────────────────────────────────────────────────────────────────

function B2BHeader({ b2bUser, cartCount, onHome, onCart, onDashboard, onCredit, onSearch, onCat }: {
  b2bUser: B2BUser; cartCount: number; onHome: () => void; onCart: () => void;
  onDashboard: () => void; onCredit: () => void; onSearch: () => void; onCat: (id: string) => void;
}) {
  return (
    <header className="sticky top-0 z-50 shadow-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#263238 0%,#37474F 100%)" }}>
      <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center gap-2.5">
        <button onClick={onHome} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow" style={{ background: "#2F7F75" }}>
            <span className="text-white font-black text-xs">BK</span>
          </div>
          <div className="hidden md:block">
            <div className="text-white font-black text-sm leading-none">BuildKart <span className="font-normal text-white/60">B2B</span></div>
            <div className="text-white/40 text-[9px] leading-none">Trade · Procurement · RFQ</div>
          </div>
          <span className="md:hidden text-white font-black text-sm">BK <span className="font-normal text-white/60 text-xs">B2B</span></span>
        </button>

        {/* Search — SKU/spec oriented */}
        <button onClick={onSearch} className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-left hover:bg-white/15 transition-colors max-w-xl">
          <svg width="13" height="13" className="text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span className="text-xs text-white/50 flex-1">Search by SKU, brand, spec, seller…</span>
          <span className="hidden md:inline text-[9px] font-bold text-white/40 border-l border-white/20 pl-2">Advanced ▾</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Credit balance chip */}
          <button onClick={onCredit} className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/20 transition-colors">
            <span className="text-[10px] text-white/50">Credit</span>
            <span className="text-[11px] font-black text-white">{fmt(b2bUser.creditLimit - b2bUser.creditUsed)}</span>
            <span className="text-[9px] text-white/40">free</span>
          </button>
          <button onClick={onDashboard} className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white/80 text-xs font-bold hover:bg-white/20 transition-colors">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: "#2F7F75" }}>{b2bUser.name.charAt(0)}</div>
            {b2bUser.businessName.split(" ")[0]}
          </button>
          <button onClick={onCart} className="relative text-white/70 hover:text-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center" style={{ background: "#F6C6A8", color: "#7A3A1A" }}>{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Nav row — trade-functional */}
      <div className="border-t border-white/10 overflow-x-auto">
        <div className="max-w-5xl mx-auto px-3 flex items-center">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => onCat(c.id)} className="text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-bold px-3 py-2 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1">
              <span className="text-xs">{c.icon}</span>{c.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 px-2 flex-shrink-0">
            <button className="text-[10px] font-bold text-white/60 hover:text-white px-2 py-2 whitespace-nowrap">📋 RFQ</button>
            <button className="text-[10px] font-bold text-white/60 hover:text-white px-2 py-2 whitespace-nowrap">💬 WhatsApp</button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── B2B Bottom Nav ────────────────────────────────────────────────────────────

function B2BBottomNav({ active, onChange }: { active: B2BScreen; onChange: (s: B2BScreen) => void }) {
  const tabs: Array<{ id: B2BScreen; icon: string; label: string }> = [
    { id: "home", icon: "🏢", label: "Trade" },
    { id: "quotations", icon: "📋", label: "Quotes" },
    { id: "credit", icon: "💳", label: "Credit" },
    { id: "cart", icon: "🗂️", label: "Order" },
    { id: "dashboard", icon: "📊", label: "Account" },
  ];
  return (
    <nav className="md:hidden bg-bk-card border-t border-bk-border flex flex-shrink-0 shadow-xl">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${active === t.id ? "" : "text-bk-muted"}`}
          style={active === t.id ? { color: "#2F7F75" } : {}}>
          <span className="text-base leading-none">{t.icon}</span>
          <span className="text-[9px] font-bold leading-none">{t.label}</span>
          {active === t.id && <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: "#2F7F75" }} />}
        </button>
      ))}
    </nav>
  );
}

// ── Root B2B App ──────────────────────────────────────────────────────────────

export default function B2BApp({ baseUser, onSwitchB2C }: { baseUser: { name: string; phone: string }; onSwitchB2C: () => void }) {
  const [b2bUser, setB2BUser] = useState<B2BUser | null>(null);
  const [screen, setScreen] = useState<B2BScreen>("register");
  const [prevScreen, setPrevScreen] = useState<B2BScreen>("home");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentCatId, setCurrentCatId] = useState("plumbing");
  const [rfqProduct, setRfqProduct] = useState<Product | null>(null);
  const [showRFQ, setShowRFQ] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [cart, setCart] = useState<B2BCartItem[]>([]);
  const [orderId, setOrderId] = useState("");

  function go(s: B2BScreen) { setPrevScreen(screen); setScreen(s); }

  function addToCart(item: B2BCartItem) {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.product.id === item.product.id);
      if (i >= 0) { const n = [...prev]; n[i] = { ...n[i], qty: n[i].qty + item.qty }; return n; }
      return [...prev, item];
    });
  }
  function removeFromCart(id: number) { setCart((p) => p.filter((x) => x.product.id !== id)); }
  function changeQty(id: number, d: number) { setCart((p) => p.map((x) => x.product.id === id ? { ...x, qty: Math.max(1, x.qty + d) } : x)); }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const hideChrome = ["checkout", "confirm"].includes(screen);

  if (!b2bUser || screen === "register") {
    return (
      <div className="h-full flex flex-col bg-bk-surface">
        <div className="flex items-center gap-3 px-4 py-3 shadow-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#263238,#37474F)" }}>
          <button onClick={onSwitchB2C} className="text-white/60 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#2F7F75" }}>
              <span className="text-white font-black text-xs">BK</span>
            </div>
            <span className="text-white font-black text-sm">BuildKart B2B · Trade Portal</span>
          </div>
        </div>
        <B2BRegister user={baseUser} onDone={(u) => { setB2BUser(u); setScreen("home"); }} onBack={onSwitchB2C} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bk-surface">
      {showRFQ && <RFQOverlay product={rfqProduct} b2bUser={b2bUser} onClose={() => setShowRFQ(false)} onSubmit={() => { setShowRFQ(false); go("quotations"); }} />}
      {showQuickOrder && <QuickOrderOverlay onClose={() => setShowQuickOrder(false)} />}

      {!hideChrome && (
        <B2BHeader b2bUser={b2bUser} cartCount={cartCount} onHome={() => go("home")} onCart={() => go("cart")} onDashboard={() => go("dashboard")} onCredit={() => go("credit")} onSearch={() => {}} onCat={(id) => { setCurrentCatId(id); go("category"); }} />
      )}

      {screen === "home" && (
        <B2BHome b2bUser={b2bUser} onProduct={(p) => { setCurrentProduct(p); go("product"); }}
          onBulkList={() => go("bulklist")} onDashboard={() => go("dashboard")}
          onQuotations={() => go("quotations")} onQuickOrder={() => setShowQuickOrder(true)}
          onCat={(id) => { setCurrentCatId(id); go("category"); }} />
      )}
      {screen === "category" && (
        <B2BCategoryPage catId={currentCatId} b2bUser={b2bUser} onProduct={(p) => { setCurrentProduct(p); go("product"); }} onBack={() => go("home")} />
      )}
      {screen === "product" && currentProduct && (
        <B2BProductPage p={currentProduct} b2bUser={b2bUser}
          onBack={() => setScreen(prevScreen)}
          onAddCart={(item) => { addToCart(item); go("cart"); }}
          onRFQ={(p) => { setRfqProduct(p); setShowRFQ(true); }} />
      )}
      {screen === "bulklist" && <BulkListPage b2bUser={b2bUser} onBack={() => go("home")} />}
      {screen === "cart" && (
        <B2BCart items={cart} onRemove={removeFromCart} onQty={changeQty} onCheckout={() => go("checkout")} onBack={() => go("home")} b2bUser={b2bUser} />
      )}
      {screen === "checkout" && (
        <B2BCheckout items={cart} b2bUser={b2bUser} onConfirm={(id) => { setOrderId(id); setCart([]); go("confirm"); }} onBack={() => go("cart")} />
      )}
      {screen === "confirm" && <B2BConfirm orderId={orderId} onHome={() => go("home")} />}
      {screen === "credit" && <CreditMenu b2bUser={b2bUser} onBack={() => go(prevScreen === "credit" ? "home" : prevScreen)} />}
      {screen === "dashboard" && <B2BDashboard b2bUser={b2bUser} onBack={() => go("home")} onQuotations={() => go("quotations")} onCredit={() => go("credit")} />}
      {screen === "quotations" && <QuotationsPage onBack={() => go("home")} />}

      {!hideChrome && <B2BBottomNav active={screen} onChange={go} />}

      {/* Switch to B2C */}
      <div className="hidden md:block fixed bottom-4 right-4 z-40">
        <button onClick={onSwitchB2C} className="bg-bk-card border-2 border-bk-border rounded-xl px-3 py-2 text-[11px] font-bold text-bk-muted shadow hover:border-bk-teal hover:text-bk-blue transition-all">
          ↩ Switch to B2C
        </button>
      </div>
    </div>
  );
}
