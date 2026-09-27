import { useState, useEffect, useRef } from "react";
import { PRODUCTS, CATEGORIES, BANNERS, type Product, type CartItem, type Category } from "./data";
import B2BApp from "./B2BApp";

type Screen = "home"|"category"|"product"|"cart"|"checkout"|"confirm"|"track"|"orders"|"search"|"login"|"signup";

interface User { name: string; phone: string; email: string; city: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2) + "L";
  return "₹" + n.toLocaleString("en-IN");
}
function disc(p: Product) { return Math.round(((p.mrp - p.price) / p.mrp) * 100); }

function Stars({ r, count, sm }: { r: number; count?: number; sm?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${sm ? "text-[10px]" : "text-xs"}`}>
      <span className={`inline-flex items-center gap-0.5 font-bold rounded px-1.5 py-0.5 ${sm ? "text-[9px]" : "text-[11px]"}`}
        style={{ background: r >= 4.3 ? "#2F7F75" : r >= 3.5 ? "#C8934A" : "#C87272", color: "#fff" }}>
        {r.toFixed(1)} ★
      </span>
      {count !== undefined && <span className="text-bk-muted">({count >= 1000 ? (count / 1000).toFixed(1) + "k" : count})</span>}
    </div>
  );
}

function VerifiedBadge({ type }: { type: "gst"|"kyc"|"assured" }) {
  const map = { gst: { l: "GST", c: "#2F7F75", bg: "#EEF8F5" }, kyc: { l: "KYC", c: "#4A7FB8", bg: "#EAF3FD" }, assured: { l: "BuildKart Assured", c: "#2F7F75", bg: "#EEF8F5" } };
  const { l, c, bg } = map[type];
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: c, background: bg, borderColor: c + "44" }}>✓ {l}</span>;
}

// ── Product Card ──────────────────────────────────────────────────────────────

function PCard({ p, onClick, onAdd, wide }: { p: Product; onClick: () => void; onAdd: (e: React.MouseEvent) => void; wide?: boolean }) {
  const d = disc(p);
  return (
    <div onClick={onClick} className={`bg-bk-card rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border border-bk-border flex flex-col ${wide ? "" : ""}`}>
      <div className="relative bg-bk-mint aspect-square overflow-hidden">
        <img src={p.img} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
        {p.badge && <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow" style={{ background: "#C87272" }}>{p.badge}</span>}
        {d >= 25 && !p.badge && <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F6C6A8", color: "#7A3A1A" }}>{d}% OFF</span>}
        <button onClick={onAdd} className="absolute bottom-2 right-2 bg-white/95 rounded-full w-7 h-7 flex items-center justify-center shadow-md transition-all text-sm font-bold hover:scale-110" style={{ color: "#2F7F75" }}>+</button>
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#2F7F75" }}>{p.brand}</p>
        <p className="text-xs font-medium text-bk-ink leading-tight line-clamp-2 mb-1.5 flex-1">{p.name}</p>
        <Stars r={p.rating} count={p.reviews} sm />
        <div className="flex items-baseline gap-1 mt-1.5 flex-wrap">
          <span className="text-sm font-black text-bk-ink">{fmt(p.price)}</span>
          {d > 0 && <><span className="text-[10px] text-bk-muted line-through">{fmt(p.mrp)}</span><span className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{d}% off</span></>}
        </div>
        <p className="text-[9px] text-bk-muted mt-0.5">{p.delivery}</p>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

// ── Auth / Login Screens ──────────────────────────────────────────────────────

function LoginScreen({ onDone, onBack, afterLoginGo }: { onDone: (u: User) => void; onBack: () => void; afterLoginGo?: string }) {
  const [phase, setPhase]   = useState<"phone"|"otp"|"profile">("phone");
  const [phone, setPhone]   = useState("");
  const [otp,   setOtp]     = useState(["","","","","",""]);
  const [name,  setName]    = useState("");
  const [email, setEmail]   = useState("");
  const [city,  setCity]    = useState("");
  const [sending, setSending] = useState(false);
  const [timer,  setTimer]  = useState(0);
  const [isNew,  setIsNew]  = useState(true);
  const refs = Array.from({length:6}, () => useRef<HTMLInputElement>(null));

  function sendOTP() {
    if (phone.length < 10) return;
    setSending(true);
    setTimeout(() => { setSending(false); setPhase("otp"); setTimer(30); setIsNew(phone.slice(-1) !== "1"); }, 1200);
  }

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  function handleOtpKey(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs[i + 1].current?.focus();
    if (!val && i > 0) refs[i - 1].current?.focus();
  }

  function verifyOTP() {
    const code = otp.join("");
    if (code.length < 6) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (isNew) { setPhase("profile"); }
      else { onDone({ name:"Rajesh Kumar", phone, email:"rajesh@gmail.com", city:"Jaipur" }); }
    }, 1000);
  }

  function completeSignup() {
    if (!name.trim()) return;
    onDone({ name: name.trim(), phone, email: email.trim(), city: city.trim() || "India" });
  }

  const Q = "?w=800&h=900&fit=crop&auto=format";
  const heroBg = "https://images.unsplash.com/photo-1518709414768-a88981a4515d" + Q;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col md:flex-row bg-bk-card overflow-hidden">
      {/* Left panel — hero (desktop only) */}
      <div className="hidden md:flex md:w-[45%] relative flex-col justify-end p-10 overflow-hidden flex-shrink-0">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,#2F7F75fa 40%,#3D9E9288 80%,transparent)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "#FAF8F3" }}>
              <span className="font-black text-lg" style={{ color: "#2F7F75" }}>BK</span>
            </div>
            <div>
              <p className="text-white font-black text-2xl leading-none">BuildKart</p>
              <p className="text-white/50 text-xs">India's Building Marketplace</p>
            </div>
          </div>
          <h2 className="text-white font-black text-3xl leading-tight mb-3">Shop smarter,<br/>build better.</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">Access 10,000+ verified products from plumbing to agriculture. GST invoices, easy returns, and same-day delivery in 200+ cities.</p>
          <div className="flex flex-wrap gap-2">
            {["✓ GST Invoice","✓ Verified Sellers","✓ Easy Returns","✓ 24/7 Support"].map((t) => (
              <span key={t} className="text-[11px] font-bold text-white/80 bg-white/10 border border-white/20 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-bk-border" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
          <button onClick={onBack} className="text-white/80 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FAF8F3" }}><span className="font-black text-xs" style={{ color: "#2F7F75" }}>BK</span></div>
            <span className="text-white font-black text-sm">BuildKart</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8 max-w-md mx-auto w-full">
          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-8">
            {(["phone","otp","profile"] as const).map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all`} style={{ width: phase === p ? 24 : 8, background: phase === p ? "#2F7F75" : i < ["phone","otp","profile"].indexOf(phase) ? "#7CCFC1" : "#E3E8E6" }} />
              </div>
            ))}
            <span className="text-[10px] text-bk-muted ml-1">
              {phase === "phone" ? "Step 1 of 3" : phase === "otp" ? "Step 2 of 3" : "Step 3 of 3"}
            </span>
          </div>

          {/* ── PHASE: Phone ── */}
          {phase === "phone" && (
            <div>
              <h1 className="text-2xl font-black text-bk-ink mb-1">Welcome to BuildKart</h1>
              <p className="text-sm text-bk-muted mb-8">Enter your mobile number to continue</p>
              <div className="mb-5">
                <label className="block text-xs font-bold text-bk-ink2 mb-2">Mobile Number</label>
                <div className="flex border-2 border-bk-border rounded-2xl overflow-hidden focus-within:border-bk-teal transition-colors">
                  <div className="flex items-center gap-2 px-4 py-3.5 bg-bk-surface border-r border-bk-border flex-shrink-0">
                    <span className="text-base">🇮🇳</span>
                    <span className="text-sm font-bold text-bk-ink">+91</span>
                  </div>
                  <input
                    type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/,"").slice(0,10))}
                    placeholder="9876543210" className="flex-1 px-4 py-3.5 text-sm font-medium outline-none bg-transparent text-bk-ink"
                    onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={sendOTP} disabled={phone.length < 10 || sending} className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all ${phone.length === 10 && !sending ? "hover:opacity-90 active:scale-[0.98]" : "opacity-40 cursor-not-allowed"}`} style={{ background: "#2F7F75" }}>
                {sending ? "Sending OTP…" : "Get OTP →"}
              </button>
              <p className="text-[10px] text-bk-muted text-center mt-4">By continuing you agree to BuildKart's <span className="text-bk-blue font-semibold">Terms</span> & <span className="text-bk-blue font-semibold">Privacy Policy</span></p>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-bk-border" />
                <span className="text-[11px] text-bk-muted font-medium">or sign in with</span>
                <div className="flex-1 h-px bg-bk-border" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[["🔵","Google"],["💼","LinkedIn"]].map(([ico,label]) => (
                  <button key={label} className="flex items-center justify-center gap-2 py-3 border-2 border-bk-border rounded-2xl text-xs font-bold text-bk-ink2 hover:border-bk-blue hover:text-bk-blue transition-colors">
                    <span className="text-base">{ico}</span>{label}
                  </button>
                ))}
              </div>
              <div className="mt-6 p-3 bg-bk-surface rounded-2xl border border-bk-border text-center">
                <p className="text-[10px] text-bk-muted font-medium">Demo hint: Use any 10-digit number. Any 6-digit OTP works.</p>
              </div>
            </div>
          )}

          {/* ── PHASE: OTP ── */}
          {phase === "otp" && (
            <div>
              <button onClick={() => setPhase("phone")} className="flex items-center gap-1 text-bk-blue text-xs font-bold mb-6 hover:underline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Change number
              </button>
              <h1 className="text-2xl font-black text-bk-ink mb-1">Verify your number</h1>
              <p className="text-sm text-bk-muted mb-2">OTP sent to <span className="font-bold text-bk-ink">+91 {phone}</span></p>
              <p className="text-[11px] text-bk-teal font-semibold mb-8">✦ Demo: enter any 6 digits</p>

              <div className="flex gap-2.5 mb-6 justify-center">
                {otp.map((d, i) => (
                  <input key={i} ref={refs[i]} type="tel" maxLength={1} value={d}
                    onChange={(e) => handleOtpKey(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs[i-1].current?.focus(); if (e.key === "Enter") verifyOTP(); }}
                    className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all ${d ? "border-bk-blue bg-bk-mint text-bk-blue" : "border-bk-border bg-bk-surface text-bk-ink"} focus:border-bk-blue focus:bg-bk-mint`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button onClick={verifyOTP} disabled={otp.join("").length < 6 || sending} className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all ${otp.join("").length === 6 && !sending ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"}`} style={{ background: "#2F7F75" }}>
                {sending ? "Verifying…" : "Verify OTP →"}
              </button>

              <div className="flex items-center justify-center gap-2 mt-5">
                {timer > 0 ? (
                  <p className="text-xs text-bk-muted">Resend OTP in <span className="font-bold text-bk-blue">{timer}s</span></p>
                ) : (
                  <button onClick={() => { setTimer(30); setOtp(["","","","","",""]); }} className="text-xs font-bold text-bk-teal hover:underline">Resend OTP</button>
                )}
              </div>
            </div>
          )}

          {/* ── PHASE: Profile (new user) ── */}
          {phase === "profile" && (
            <div>
              <div className="w-16 h-16 bg-bk-mint rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">🎉</div>
              <h1 className="text-2xl font-black text-bk-ink mb-1">Almost there!</h1>
              <p className="text-sm text-bk-muted mb-6">Complete your profile to start shopping</p>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-bk-ink2 mb-1.5">Full Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="eg. Rajesh Kumar" className="w-full border-2 border-bk-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-bk-blue transition-colors" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-bold text-bk-ink2 mb-1.5">Email <span className="text-bk-muted font-normal">(optional)</span></label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rajesh@example.com" type="email" className="w-full border-2 border-bk-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-bk-blue transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-bk-ink2 mb-1.5">City</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {["Jaipur","Mumbai","Delhi","Hyderabad","Bengaluru","Pune"].map((c) => (
                      <button key={c} onClick={() => setCity(c)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${city === c ? "bg-bk-blue text-white border-bk-blue" : "border-bk-border text-bk-muted hover:border-bk-blue"}`}>{c}</button>
                    ))}
                  </div>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Or type your city…" className="w-full border-2 border-bk-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-bk-blue transition-colors" />
                </div>
              </div>
              <button onClick={completeSignup} disabled={!name.trim()} className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all ${name.trim() ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"}`} style={{ background: "#2F7F75" }}>
                🚀 Start Shopping →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ cartCount, onSearch, onCart, onHome, user, onLogin, onOrders }: { cartCount: number; onSearch: () => void; onCart: () => void; onHome: () => void; user: User|null; onLogin: () => void; onOrders: () => void }) {
  return (
    <header className="sticky top-0 z-50 shadow-sm" style={{ background: "linear-gradient(135deg,#2F7F75 0%,#3D9E92 60%,#7CCFC1 100%)" }}>
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <button onClick={onHome} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow" style={{ background: "#FAF8F3" }}>
              <span className="font-black text-xs md:text-sm" style={{ color: "#2F7F75" }}>BK</span>
            </div>
            <div className="hidden md:block">
              <div className="text-white font-black text-lg leading-none tracking-tight">BuildKart</div>
              <div className="text-white/50 text-[9px] leading-none font-medium">India's Building Materials Marketplace</div>
            </div>
            <div className="md:hidden">
              <div className="text-white font-black text-base leading-none">BuildKart</div>
            </div>
          </button>

          {/* Search */}
          <button onClick={onSearch} className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-left shadow-inner max-w-2xl">
            <svg width="14" height="14" className="text-bk-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="text-xs text-bk-muted flex-1">Search plumbing, electricals, tools…</span>
            <span className="hidden md:inline text-[10px] font-bold border-l border-bk-border pl-2" style={{ color: "#2F7F75" }}>🎤 Voice</span>
          </button>

          {/* Location pill - desktop */}
          <div className="hidden lg:flex items-center gap-1 text-white/70 text-xs flex-shrink-0">
            <span>📍</span><span className="font-medium">Jaipur</span><span className="opacity-40">▾</span>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <button onClick={onOrders} className="hidden md:flex items-center gap-2 text-white/90 hover:text-white text-xs font-medium bg-white/10 rounded-xl px-3 py-1.5 transition-colors">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: "#FAF8F3", color: "#2F7F75" }}>{user.name.charAt(0)}</div>
                <span className="max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
              </button>
            ) : (
              <button onClick={onLogin} className="hidden md:flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium bg-white/10 rounded-xl px-3 py-1.5 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Login</span></button>
            )}
            <button onClick={onCart} className="relative text-white/80 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && <span className="absolute -top-2 -right-2 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5" style={{ background: "#F6C6A8", color: "#7A3A1A" }}>{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Mobile promo + location */}
        <div className="flex items-center gap-3 mt-1.5 md:mt-2">
          <div className="flex items-center gap-1 text-white/60 text-[10px] md:hidden"><span>📍</span><span>Jaipur, 302001</span><span>▾</span></div>
          <div className="flex gap-3 overflow-x-auto ml-2">
            {["Free delivery ₹499+","GST Invoice","Easy Returns","Verified Sellers","24/7 Support"].map((t) => (
              <span key={t} className="text-[9px] font-semibold whitespace-nowrap flex-shrink-0" style={{ color: "#F5E6A8" }}>✦ {t}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Desktop nav tabs */}
      <div className="hidden md:block border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium px-4 py-2 transition-colors flex items-center gap-1.5">
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
          <button className="hover:text-white hover:bg-white/10 text-xs font-bold px-4 py-2 transition-colors ml-auto" style={{ color: "#F5E6A8" }}>🔥 Today's Deals</button>
        </div>
      </div>
    </header>
  );
}

// ── Bottom Nav (mobile only) ──────────────────────────────────────────────────

function BottomNav({ active, onChange, cartCount, user, onLogin }: { active: string; onChange: (s: Screen) => void; cartCount: number; user: User|null; onLogin: () => void }) {
  const tabs = [
    { id:"home" as Screen, icon:"🏠", label:"Home" },
    { id:"category" as Screen, icon:"⊞", label:"Browse" },
    { id:"orders" as Screen, icon:"📦", label:"Orders" },
    { id:"cart" as Screen, icon:"🛒", label:cartCount > 0 ? `Cart(${cartCount})` : "Cart" },
  ];
  return (
    <nav className="md:hidden bg-bk-card border-t border-bk-border flex flex-shrink-0 shadow-xl">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${active === t.id ? "text-bk-blue" : "text-bk-muted"}`}>
          <span className="text-lg leading-none">{t.icon}</span>
          <span className={`text-[9px] font-bold leading-none ${active === t.id ? "text-bk-blue" : "text-bk-muted"}`}>{t.label}</span>
          {active === t.id && <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: "#2F7F75" }} />}
        </button>
      ))}
      {/* Profile / Login button */}
      <button onClick={user ? () => onChange("orders") : onLogin} className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${active === "login" ? "text-bk-blue" : "text-bk-muted"}`}>
        {user ? (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "#EEF8F5", color: "#2F7F75" }}>{user.name.charAt(0)}</div>
        ) : (
          <span className="text-lg leading-none">👤</span>
        )}
        <span className="text-[9px] font-bold leading-none">{user ? user.name.split(" ")[0] : "Login"}</span>
      </button>
    </nav>
  );
}

// ── Search Overlay ────────────────────────────────────────────────────────────

function SearchOverlay({ onClose, onProduct, onAdd }: { onClose: () => void; onProduct: (p: Product) => void; onAdd: (p: Product) => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const results = q.length >= 2 ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()) || p.subcat.toLowerCase().includes(q.toLowerCase())).slice(0, 24) : [];

  return (
    <div className="fixed inset-0 z-[60] bg-bk-card flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 shadow-sm" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
        <button onClick={onClose} className="text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands, categories…" className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm outline-none" />
        {q && <button onClick={() => setQ("")} className="text-white/60 hover:text-white text-lg">✕</button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full">
        {!q && (
          <div>
            <p className="text-xs font-bold text-bk-ink2 mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {["BLDC Ceiling Fan","Jaquar Bib Cock","Wall Putty 40kg","Bosch Drill","Kohler WC","Drip Irrigation","LED Bulb","Dr. Fixit Waterproof","TOTO Toilet","Kirloskar Pump"].map((s) => (
                <button key={s} onClick={() => setQ(s)} className="text-xs bg-bk-surface border border-bk-border rounded-full px-3 py-1.5 text-bk-ink2 hover:border-bk-blue hover:text-bk-blue transition-colors">{s}</button>
              ))}
            </div>
            <p className="text-xs font-bold text-bk-ink2 mb-3">Browse by Category</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} className="flex items-center gap-2 p-3 rounded-xl border border-bk-border hover:border-bk-blue transition-colors bg-bk-surface" onClick={onClose}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-xs font-medium text-bk-ink2">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {results.length > 0 && (
          <div>
            <p className="text-xs text-bk-muted mb-3">{results.length} results for "<span className="font-semibold text-bk-ink">{q}</span>"</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((p) => (
                <PCard key={p.id} p={p} onClick={() => { onProduct(p); onClose(); }} onAdd={(e) => { e.stopPropagation(); onAdd(p); }} />
              ))}
            </div>
          </div>
        )}
        {q.length >= 2 && results.length === 0 && (
          <div className="text-center py-16 text-bk-muted"><div className="text-5xl mb-3">🔍</div><p className="font-semibold">No results for "{q}"</p></div>
        )}
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────

// Horizontal scroll deal/seller strip (reused for Flash Deals and Best Sellers)
function HScrollStrip({ products, onProduct, badgeFn }: {
  products: Product[];
  onProduct: (p: Product) => void;
  badgeFn: (p: Product) => string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto -mx-3 px-3 pb-1">
      {products.map((p) => (
        <div key={p.id} onClick={() => onProduct(p)}
             className="flex-shrink-0 w-36 md:w-44 bg-bk-card rounded-xl overflow-hidden border border-bk-border/60 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="relative bg-gray-50" style={{ height: 110 }}>
            <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: "#F6C6A8", color: "#7A3A1A" }}>{badgeFn(p)}</span>
          </div>
          <div className="p-2">
            <p className="text-[9px] font-bold uppercase" style={{ color: "#2F7F75" }}>{p.brand}</p>
            <p className="text-[10px] font-medium text-bk-ink leading-tight line-clamp-2 mt-0.5">{p.name}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs font-black">{fmt(p.price)}</span>
              <span className="text-[9px] text-bk-muted line-through">{fmt(p.mrp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Standard mini grid — split tile always at end
function HomeMiniGrid({ products, catId, slotType, onProduct, onAdd }: {
  products: Product[];
  catId: string | null;
  slotType: SlotType;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const excludeIds = new Set(products.map((p) => p.id));
  const slot = buildSlot(slotType, catId, excludeIds);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {products.map((p) => (
        <PCard key={p.id} p={p} onClick={() => onProduct(p)} onAdd={(e) => { e.stopPropagation(); onAdd(p); }} />
      ))}
      {slot && <MerchandisingSlot slot={slot} onProduct={onProduct} onAdd={onAdd} />}
    </div>
  );
}

// Alternate 5+1 design: first product gets a wide featured card (col-span-2),
// remaining 4 are regular cards, split tile at end
function FeaturedMiniGrid({ products, catId, slotType, onProduct, onAdd }: {
  products: Product[];
  catId: string | null;
  slotType: SlotType;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const [hero, ...rest] = products;
  const excludeIds = new Set(products.map((p) => p.id));
  const slot = buildSlot(slotType, catId, excludeIds);
  const d = disc(hero);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Featured hero card — spans 2 columns */}
      <div onClick={() => onProduct(hero)}
           className="col-span-2 bg-bk-card rounded-2xl border border-bk-border overflow-hidden flex cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
        <div className="relative w-32 md:w-40 flex-shrink-0 bg-bk-mint">
          <img src={hero.img} alt={hero.name} className="w-full h-full object-cover" />
          {d >= 20 && (
            <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow"
                  style={{ background: "#F6C6A8", color: "#7A3A1A" }}>{d}% OFF</span>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#2F7F75" }}>{hero.brand}</p>
            <p className="text-sm font-semibold text-bk-ink leading-snug mt-0.5 line-clamp-3">{hero.name}</p>
            <div className="mt-1.5"><Stars r={hero.rating} count={hero.reviews} sm /></div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-black text-bk-ink">{fmt(hero.price)}</span>
              {d > 0 && <span className="text-[10px] text-bk-muted line-through">{fmt(hero.mrp)}</span>}
              {d > 0 && <span className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{d}% off</span>}
            </div>
            <p className="text-[9px] mt-0.5" style={{ color: "#2F7F75" }}>✓ {hero.delivery}</p>
            <button onClick={(e) => { e.stopPropagation(); onAdd(hero); }}
                    className="mt-2 px-3 py-1.5 text-white text-[10px] font-black rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                    style={{ background: "#2F7F75" }}>+ Add to Cart</button>
          </div>
        </div>
      </div>

      {/* Remaining 4 regular cards */}
      {rest.map((p) => (
        <PCard key={p.id} p={p} onClick={() => onProduct(p)} onAdd={(e) => { e.stopPropagation(); onAdd(p); }} />
      ))}

      {/* Split tile at end */}
      {slot && <MerchandisingSlot slot={slot} onProduct={onProduct} onAdd={onAdd} />}
    </div>
  );
}

const HOME_REPEAT_CONFIGS = [
  { cat: "electrical",   headline: "⚡ Power Your Home Right",    sub: "Switches · MCBs · BLDC Fans",        cta: "Shop Electrical", img: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=800&h=220&fit=crop&auto=format", grad: "#1A0B4B,#2F5AB8" },
  { cat: "plumbing",     headline: "🔩 Every Drop Counts",        sub: "CPVC Pipes · Mixers · Valves",        cta: "Shop Plumbing",   img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=220&fit=crop&auto=format", grad: "#0B3B4B,#1A7FA5" },
  { cat: "sanitary",     headline: "🛁 Luxury Bathrooms",         sub: "TOTO · Duravit · Kohler",             cta: "Explore Premium", img: "https://images.unsplash.com/photo-1733426107854-ee00a25d72a7?w=800&h=220&fit=crop&auto=format", grad: "#1A0533,#7C3AED" },
  { cat: "construction", headline: "🎨 Colour Your World",        sub: "Asian Paints · Berger · Pidilite",    cta: "Shop Paints",     img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&h=220&fit=crop&auto=format", grad: "#4B1A00,#C87242" },
  { cat: "hardware",     headline: "🔧 Build Stronger",           sub: "Bosch · Stanley · Power Tools",       cta: "Shop Tools",      img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=220&fit=crop&auto=format", grad: "#1A1A3A,#4A4A7A" },
  { cat: "agriculture",  headline: "🌾 Kisan Special",            sub: "Pumps · Drip Kits · Sprayers",        cta: "Shop Farm",       img: "https://images.unsplash.com/photo-1573119798379-011dfedae008?w=800&h=220&fit=crop&auto=format", grad: "#064E3B,#10B981" },
  { cat: "electrical",   headline: "💡 Smart Lighting",           sub: "LED Bulbs · Tubes · Strip Lights",    cta: "Shop Lighting",   img: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&h=220&fit=crop&auto=format", grad: "#0B2E4B,#1A6FA5" },
  { cat: "plumbing",     headline: "🚿 Zero Leaks Guaranteed",    sub: "Premium CPVC · PEX · UPVC",           cta: "Shop Now",        img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=220&fit=crop&auto=format", grad: "#0B4B1A,#1AA56F" },
  { cat: "construction", headline: "🏗️ Foundation First",        sub: "Waterproofing · Adhesives · Grout",   cta: "Shop Now",        img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=220&fit=crop&auto=format", grad: "#4B3A00,#A57B1A" },
  { cat: "hardware",     headline: "🛠️ Pro Workshop",            sub: "Power Tools · Locks · Fasteners",     cta: "Shop Tools",      img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=220&fit=crop&auto=format", grad: "#2A0B4B,#5A3A8F" },
];

function HomePage({ onCat, onProduct, onAdd }: { onCat: (id: string) => void; onProduct: (p: Product) => void; onAdd: (p: Product) => void }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 4000); return () => clearInterval(t); }, []);

  const flashDeals  = PRODUCTS.filter((p) => disc(p) >= 28).slice(0, 12);
  const bestSellers = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 12);
  const topRated    = PRODUCTS.filter((p) => p.rating >= 4.6).slice(0, 8);

  // Pool for repeat blocks: all products, cycled if needed
  const pool = PRODUCTS;

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      {/* Hero banner */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        {BANNERS.map((b, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <img src={b.img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right,${b.grad.split(",")[0]}ee,${b.grad.split(",")[1]}99,transparent)` }} />
            <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-8">
              <p className="text-white font-black text-lg md:text-2xl leading-tight drop-shadow-lg max-w-xs">{b.headline}</p>
              <p className="text-white/75 text-xs md:text-sm mt-1 max-w-xs">{b.sub}</p>
              <button className="mt-3 self-start px-5 py-2 bg-white text-xs md:text-sm font-black rounded-full shadow" style={{ color: "#2F7F75" }}>{b.cta} →</button>
            </div>
          </div>
        ))}
        <div className="absolute bottom-3 right-4 flex gap-1">
          {BANNERS.map((_, i) => <button key={i} onClick={() => setSlide(i)} className={`rounded-full transition-all ${i === slide ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />)}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6">
        {/* Categories */}
        <div className="bg-bk-card rounded-2xl p-4 mt-3 shadow-sm border border-bk-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-bk-ink">Shop by Category</p>
            <button className="text-xs text-bk-blue font-semibold">View All →</button>
          </div>
          <div className="grid grid-cols-6 gap-2 md:gap-4">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => onCat(cat.id)} className="flex flex-col items-center gap-1.5 group">
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
                <span className="text-[8px] md:text-[10px] font-bold text-bk-ink2 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Brands */}
        <div className="bg-bk-card rounded-2xl p-4 mt-3 shadow-sm border border-bk-border/50">
          <p className="text-sm font-black text-bk-ink mb-3">Top Brands</p>
          <div className="flex gap-2 overflow-x-auto">
            {["Havells","Jaquar","Bosch","TOTO","Asian Paints","Kohler","Kirloskar","Orient","Pidilite","Duravit","Philips","Godrej"].map((brand) => (
              <div key={brand} className="flex-shrink-0 px-3 py-2 bg-bk-surface border border-bk-border rounded-xl text-[10px] font-bold text-bk-ink2 cursor-pointer hover:border-bk-blue hover:text-bk-blue transition-colors min-w-[68px] text-center">{brand}</div>
            ))}
          </div>
        </div>

        {/* Flash Deals */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: "#F6C6A8" }} />
              <p className="text-sm font-black text-bk-ink">Flash Deals</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F6C6A8", color: "#7A3A1A" }}>Up to 60% OFF</span>
            </div>
            <button className="text-xs text-bk-blue font-semibold">See All →</button>
          </div>
          <HScrollStrip products={flashDeals} onProduct={onProduct} badgeFn={(p) => `${disc(p)}% OFF`} />
        </div>

        {/* Best Sellers */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: "#7CCFC1" }} />
              <p className="text-sm font-black text-bk-ink">Best Sellers</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EEF8F5", color: "#2F7F75" }}>Most Loved</span>
            </div>
            <button className="text-xs text-bk-blue font-semibold">See All →</button>
          </div>
          <HScrollStrip products={bestSellers} onProduct={onProduct} badgeFn={(p) => `${(p.reviews / 1000).toFixed(1)}k reviews`} />
        </div>

        {/* Top Rated — stays as-is */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><div className="w-1 h-5 rounded-full bg-bk-blue" /><p className="text-sm font-black text-bk-ink">Top Rated Products</p></div>
            <button className="text-xs text-bk-blue font-semibold">See All →</button>
          </div>
          <ProductGridWithSlots products={topRated} catId={null} onProduct={onProduct} onAdd={onAdd} />
        </div>

        {/* 10 × [banner + 5+1 grid + 5-1 grid] */}
        {HOME_REPEAT_CONFIGS.map((cfg, blockIdx) => {
          // Each block: 5 products for 5+1 section, 5 for 5-1 section
          const base = (blockIdx * 10) % pool.length;
          const wrap = (i: number) => pool[i % pool.length];
          const prodsA = Array.from({ length: 5 }, (_, i) => wrap(base + i));
          const prodsB = Array.from({ length: 5 }, (_, i) => wrap(base + 5 + i));
          const slotTypeA = SLOT_CYCLE[blockIdx % 3];
          const slotTypeB = SLOT_CYCLE[(blockIdx + 1) % 3];

          return (
            <div key={blockIdx} className="mt-5">
              {/* Category banner */}
              <div className="rounded-2xl overflow-hidden shadow-sm relative mb-3" style={{ height: 120 }}>
                <img src={cfg.img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right,${cfg.grad.split(",")[0]}ee,${cfg.grad.split(",")[1]}88,transparent)` }} />
                <div className="absolute inset-0 flex items-center px-5">
                  <div>
                    <p className="text-white font-black text-sm leading-tight drop-shadow">{cfg.headline}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">{cfg.sub}</p>
                    <button onClick={() => onCat(cfg.cat)} className="mt-2 px-3 py-1 bg-white text-[10px] font-black rounded-full shadow" style={{ color: "#2F7F75" }}>{cfg.cta} →</button>
                  </div>
                </div>
              </div>

              {/* 5+1: every other block uses the featured wide-card alternate design */}
              {blockIdx % 2 === 1
                ? <FeaturedMiniGrid products={prodsA} catId={cfg.cat} slotType={slotTypeA} onProduct={onProduct} onAdd={onAdd} />
                : <HomeMiniGrid products={prodsA} catId={cfg.cat} slotType={slotTypeA} onProduct={onProduct} onAdd={onAdd} />
              }

              {/* 5-1: always standard, split at end */}
              <div className="mt-3">
                <HomeMiniGrid products={prodsB} catId={cfg.cat} slotType={slotTypeB} onProduct={onProduct} onAdd={onAdd} />
              </div>
            </div>
          );
        })}

        <div className="h-6" />
      </div>
    </div>
  );
}

// ── Merchandising Slot Engine ─────────────────────────────────────────────────

const sessionViewHistory: number[] = [];

type SlotType = "recently_viewed" | "complementary" | "deals";
interface MerchandisingSlotData { type: SlotType; products: [Product, Product]; }

const SLOT_CYCLE: SlotType[] = ["recently_viewed", "complementary", "deals"];

const SLOT_META: Record<SlotType, { label: string; icon: string; color: string; bg: string }> = {
  recently_viewed: { label: "Recently viewed",         icon: "🕐", color: "#4A7FB8", bg: "#EAF3FD" },
  complementary:   { label: "Pairs well",              icon: "✦",  color: "#2F7F75", bg: "#EEF8F5" },
  deals:           { label: "Save more",               icon: "🏷", color: "#7A3A1A", bg: "#F6C6A8" },
};

function buildSlot(type: SlotType, catId: string | null, excludeIds: Set<number>): MerchandisingSlotData | null {
  const pool = PRODUCTS.filter((p) => (catId ? p.cat === catId : true) && !excludeIds.has(p.id));
  let picks: Product[] = [];

  if (type === "recently_viewed") {
    const seen = new Set<number>();
    const viewed = sessionViewHistory
      .filter((id) => !excludeIds.has(id))
      .map((id) => PRODUCTS.find((p) => p.id === id && (catId ? p.cat === catId : true)))
      .filter((p): p is Product => !!p && !seen.has(p.id) && !!seen.add(p.id));
    picks = viewed.slice(0, 2);
    if (picks.length < 2) {
      const fill = pool.filter((p) => !picks.find((x) => x.id === p.id))
        .sort((a, b) => b.reviews - a.reviews).slice(0, 2 - picks.length);
      picks = [...picks, ...fill];
    }
  } else if (type === "complementary") {
    const subcats = [...new Set(pool.map((p) => p.subcat))];
    if (subcats.length >= 2) {
      const a = pool.filter((p) => p.subcat === subcats[0]).sort((a, b) => b.reviews - a.reviews)[0];
      const b = pool.filter((p) => p.subcat === subcats[1]).sort((a, b) => b.reviews - a.reviews)[0];
      if (a && b) picks = [a, b];
    }
    if (picks.length < 2) picks = [...pool].sort((a, b) => b.reviews - a.reviews).slice(0, 2);
  } else {
    picks = [...pool].sort((a, b) => disc(b) - disc(a)).slice(0, 2);
  }

  if (picks.length < 2) return null;
  return { type, products: [picks[0], picks[1]] };
}

// Slot tile — occupies exactly one card position in the grid (col-span-1).
// Split left | right into two mini-product cards with select details.
// Because it's col-span-1, CSS auto-placement works identically to a regular card.
function MerchandisingSlot({ slot, onProduct, onAdd }: {
  slot: MerchandisingSlotData;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const meta = SLOT_META[slot.type];
  const isDeals = slot.type === "deals";

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col gap-0.5 p-0.5"
         style={{ background: meta.bg, alignSelf: "stretch" }}>
      {/* Label — minimal height */}
      <div className="px-1.5 py-0.5 flex-shrink-0">
        <span className="text-[8px] font-bold leading-none" style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
      </div>

      {/* Two mini-cards — flex-1 + min-h-0 so they each claim half the remaining height */}
      {slot.products.map((p) => {
        const d = disc(p);
        return (
          <div key={p.id}
               onClick={() => onProduct(p)}
               className="flex-1 min-h-0 bg-bk-card rounded-xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform">
            {/* Image: relative+absolute so it never pushes the card taller */}
            <div className="relative flex-1 min-h-0 bg-bk-mint">
              <img src={p.img} alt={p.name}
                   className="absolute inset-0 w-full h-full object-cover"
                   loading="lazy" />
              {isDeals && d > 0 && (
                <span className="absolute top-1 left-1 text-[7px] font-black px-1 py-0.5 rounded-full leading-none shadow-sm"
                      style={{ background: "#C87272", color: "#fff" }}>{d}%</span>
              )}
              <button onClick={(e) => { e.stopPropagation(); onAdd(p); }}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow hover:scale-110 transition-transform"
                      style={{ background: "rgba(255,255,255,0.92)", color: "#2F7F75" }}>+</button>
            </div>
            {/* Fixed-height details strip */}
            <div className="flex-shrink-0 px-1.5 py-1">
              <p className="text-[9px] font-medium text-bk-ink leading-tight line-clamp-1">{p.name}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[10px] font-black text-bk-ink">{fmt(p.price)}</span>
                {d > 0 && <span className="text-[8px] font-semibold" style={{ color: "#2F7F75" }}>{d}%off</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Build a flat array of product + slot items for a grid.
// Inserts one slot after every 5 regular product cards.
// Slots are col-span-1 so they slot in like any card — no alignment tricks needed.
function buildGridItems(products: Product[], catId: string | null): Array<
  { kind: "product"; product: Product } | { kind: "slot"; slot: MerchandisingSlotData }
> {
  const items: Array<{ kind: "product"; product: Product } | { kind: "slot"; slot: MerchandisingSlotData }> = [];
  const usedIds = new Set<number>();
  let slotCycle = 0;

  for (let i = 0; i < products.length; i++) {
    items.push({ kind: "product", product: products[i] });
    usedIds.add(products[i].id);

    if ((i + 1) % 5 === 0) {
      const type = SLOT_CYCLE[slotCycle % SLOT_CYCLE.length];
      const surrounding = new Set(usedIds);
      products.slice(i + 1, i + 5).forEach((p) => surrounding.add(p.id));
      const slot = buildSlot(type, catId, surrounding);
      if (slot) { items.push({ kind: "slot", slot }); slotCycle++; }
    }
  }

  return items;
}

function ProductGridWithSlots({
  products,
  catId,
  onProduct,
  onAdd,
}: {
  products: Product[];
  catId: string | null;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const items = buildGridItems(products, catId);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, idx) =>
        item.kind === "product" ? (
          <PCard key={item.product.id} p={item.product}
                 onClick={() => onProduct(item.product)}
                 onAdd={(e) => { e.stopPropagation(); onAdd(item.product); }} />
        ) : (
          <MerchandisingSlot key={`slot-${idx}`} slot={item.slot} onProduct={onProduct} onAdd={onAdd} />
        )
      )}
    </div>
  );
}

// ── Category Page ─────────────────────────────────────────────────────────────

function CategoryPage({ catId, onProduct, onAdd, onBack, viewedIds: _viewedIds }: { catId: string; onProduct: (p: Product) => void; onAdd: (p: Product) => void; onBack: () => void; viewedIds: number[] }) {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const [brand, setBrand] = useState("All");
  const [subcat, setSubcat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [showFilter, setShowFilter] = useState(false);
  const [minP, setMinP] = useState(0);

  let products = PRODUCTS.filter((p) => p.cat === catId && (brand === "All" || p.brand === brand) && (subcat === "All" || p.subcat === subcat) && p.price >= minP);
  if (sort === "price-asc") products = [...products].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") products = [...products].sort((a, b) => b.price - a.price);
  else if (sort === "rating") products = [...products].sort((a, b) => b.rating - a.rating);
  else products = [...products].sort((a, b) => b.reviews - a.reviews);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="bg-bk-card border-b border-bk-border px-3 md:px-6 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="font-black text-sm text-bk-ink">{cat.icon} {cat.label}</span>
        <span className="text-[10px] text-bk-muted ml-1">({products.length} products)</span>
        <button onClick={() => setShowFilter(!showFilter)} className={`ml-auto text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${showFilter ? "bg-bk-blue text-white border-bk-blue" : "border-bk-border text-bk-muted"}`}>⚙ Filters</button>
      </div>

      {/* Filter drawer (mobile slide-down) */}
      {showFilter && (
        <div className="bg-bk-card border-b border-bk-border px-4 py-3 flex-shrink-0 shadow-inner">
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-bk-ink2 mb-1.5">BRAND</p>
              <div className="flex gap-1.5 flex-wrap">
                {cat.brands.map((b) => <button key={b} onClick={() => setBrand(b)} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${brand === b ? "bg-bk-blue text-white border-bk-blue" : "border-bk-border text-bk-muted hover:border-bk-blue"}`}>{b}</button>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-bk-ink2 mb-1.5">SORT</p>
              <div className="flex gap-1.5 flex-wrap">
                {[["popular","Popular"],["rating","Top Rated"],["price-asc","Price ↑"],["price-desc","Price ↓"]].map(([v,l]) => <button key={v} onClick={() => setSort(v)} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${sort === v ? "bg-bk-blue text-white border-bk-blue" : "border-bk-border text-bk-muted"}`}>{l}</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Type (subcat) chips */}
      <div className="bg-bk-card border-b border-bk-border flex-shrink-0 overflow-x-auto">
        <div className="flex px-3 py-2 gap-2 max-w-7xl mx-auto">
          {cat.subcats.map((sc) => (
            <button key={sc} onClick={() => setSubcat(sc)} className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${subcat === sc ? "bg-bk-teal text-white border-bk-teal" : "border-bk-border text-bk-muted hover:border-bk-teal hover:text-bk-teal bg-bk-surface"}`}>{sc}</button>
          ))}
        </div>
      </div>

      {/* Desktop: sort bar */}
      <div className="hidden md:flex items-center gap-3 px-6 py-2 bg-bk-card border-b border-bk-border flex-shrink-0 max-w-7xl mx-auto w-full">
        <span className="text-xs font-semibold text-bk-ink2">Sort by:</span>
        {[["popular","Popular"],["rating","Top Rated"],["price-asc","Price: Low → High"],["price-desc","Price: High → Low"]].map(([v,l]) => (
          <button key={v} onClick={() => setSort(v)} className={`text-xs px-3 py-1 rounded-lg border transition-all ${sort === v ? "bg-bk-blue text-white border-bk-blue" : "border-bk-border text-bk-muted hover:border-bk-blue"}`}>{l}</button>
        ))}
        <div className="ml-auto flex gap-2">
          {cat.brands.filter((b) => b !== "All").map((b) => <button key={b} onClick={() => setBrand(brand === b ? "All" : b)} className={`text-xs px-3 py-1 rounded-lg border transition-all ${brand === b ? "bg-bk-navy text-white border-bk-navy" : "border-bk-border text-bk-muted hover:border-bk-navy"}`}>{b}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3">
          {products.length === 0 ? (
            <div className="text-center py-20 text-bk-muted"><div className="text-5xl mb-3">📦</div><p className="font-semibold">No products found</p><button onClick={() => { setBrand("All"); setSubcat("All"); }} className="mt-3 text-sm text-bk-blue font-semibold">Clear Filters</button></div>
          ) : (
            <ProductGridWithSlots products={products} catId={catId} onProduct={onProduct} onAdd={onAdd} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Page ───────────────────────────────────────────────────────

function ProductPage({ p, onBack, onAdd, onCart }: { p: Product; onBack: () => void; onAdd: (p: Product) => void; onCart: () => void }) {
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pinOk, setPinOk] = useState<null|"local"|"national"|"no">(null);
  const [tab, setTab] = useState<"specs"|"seller"|"reviews">("specs");
  const d = disc(p);

  function handleAdd() { onAdd(p); setAdded(true); setTimeout(() => setAdded(false), 2000); }
  function handleBuy() { onAdd(p); onCart(); }

  const relatedProducts = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-bk-card border-b border-bk-border px-3 md:px-6 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
        <span className="text-xs font-semibold text-bk-ink flex-1 truncate">{p.name}</span>
        <button className="text-bk-muted hover:text-bk-blue"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-5xl mx-auto">
          {/* Main card */}
          <div className="bg-bk-card md:rounded-none md:mt-0">
            <div className="md:flex">
              {/* Image */}
              <div className="relative bg-gray-50 md:w-80 md:flex-shrink-0" style={{ minHeight: 260 }}>
                <img src={p.img} alt={p.name} className="w-full h-64 md:h-full object-cover" />
                {p.badge && <span className="absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow" style={{ background: "#C87272" }}>{p.badge}</span>}
                {d >= 25 && <span className="absolute bottom-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow" style={{ background: "#2F7F75" }}>{d}% OFF</span>}
              </div>

              {/* Info */}
              <div className="p-4 md:p-5 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#2F7F75" }}>{p.brand}</p>
                <h1 className="text-base md:text-lg font-bold text-bk-ink mt-1 leading-snug">{p.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Stars r={p.rating} count={p.reviews} />
                  <VerifiedBadge type="assured" />
                </div>

                <div className="flex items-baseline gap-3 mt-3 flex-wrap">
                  <span className="text-2xl md:text-3xl font-black text-bk-ink">{fmt(p.price)}</span>
                  {d > 0 && <><span className="text-sm text-bk-muted line-through">{fmt(p.mrp)}</span><span className="text-sm font-bold" style={{ color: "#2F7F75" }}>{d}% off</span></>}
                </div>
                <p className="text-xs text-bk-muted mt-0.5">Inclusive of all taxes · {p.delivery}</p>

                {/* Offers */}
                <div className="bg-bk-surface rounded-xl p-3 mt-3 space-y-2">
                  <p className="text-xs font-bold text-bk-ink">Available Offers</p>
                  {[`💳 Bank Offer: 10% off with HDFC Card up to ₹${Math.floor(p.price*0.1).toLocaleString("en-IN")}`,`🎁 Special Price: Extra 5% cashback on UPI payment`,`📦 ${p.delivery} for orders above ₹499`].map((o, i) => (
                    <div key={i} className="text-[11px] text-bk-ink2">{o}</div>
                  ))}
                </div>

                {/* Pincode */}
                <div className="mt-3">
                  <p className="text-xs font-bold text-bk-ink mb-2">Check Delivery</p>
                  <div className="flex gap-2">
                    <input value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/,"").slice(0,6)); setPinOk(null); }} placeholder="Enter pincode" className="flex-1 border border-bk-border rounded-xl px-3 py-2 text-xs outline-none focus:border-bk-blue" maxLength={6} />
                    <button onClick={() => pincode.length===6 && setPinOk(Math.random()>0.6?"local":Math.random()>0.2?"national":"no")} className="px-4 py-2 bg-bk-blue text-white text-xs font-bold rounded-xl">Check</button>
                  </div>
                  {pinOk==="local" && <p className="text-[11px] font-semibold mt-1" style={{ color: "#2F7F75" }}>📍 Local seller — delivery by tomorrow!</p>}
                  {pinOk==="national" && <p className="text-[11px] font-semibold mt-1 text-bk-blue">🚚 {p.delivery} to {pincode}</p>}
                  {pinOk==="no" && <p className="text-[11px] font-semibold mt-1" style={{ color: "#C87272" }}>✗ Not deliverable to {pincode}</p>}
                </div>

                {/* CTA — desktop */}
                <div className="hidden md:flex gap-3 mt-4">
                  <button onClick={handleAdd} className={`flex-1 py-3 rounded-xl text-sm font-black transition-colors shadow ${added ? "text-white" : "text-white hover:opacity-90"}`} style={{ background: added ? "#2F7F75" : "#2F7F75" }}>
                    {added ? "✓ Added to Cart" : "ADD TO CART"}
                  </button>
                  <button onClick={handleBuy} className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-colors shadow" style={{ background: "#2F7F75" }}>BUY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Specs / Seller / Reviews */}
          <div className="bg-bk-card mt-2 md:mt-3">
            <div className="flex border-b border-bk-border">
              {(["specs","seller","reviews"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs font-bold capitalize transition-colors border-b-2 -mb-px ${tab===t ? "text-bk-blue border-bk-blue" : "text-bk-muted border-transparent hover:text-bk-ink"}`}>
                  {t === "specs" ? "Specifications" : t === "seller" ? "Seller Details" : "Reviews & Ratings"}
                </button>
              ))}
            </div>
            <div className="p-4">
              {tab === "specs" && (
                <div className="divide-y divide-bk-border">
                  {p.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className="text-sm font-bold" style={{ color: "#2F7F75" }}>✓</span>
                      <span className="text-xs text-bk-ink2">{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "seller" && (
                <div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-bk-border bg-bk-surface">
                    <div className="w-14 h-14 rounded-2xl bg-bk-blue/10 flex items-center justify-center text-bk-blue font-black text-lg flex-shrink-0">
                      {p.seller.name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-bk-ink">{p.seller.name}</p>
                      <p className="text-[11px] text-bk-muted mt-0.5">📍 {p.seller.city}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.seller.gst && <VerifiedBadge type="gst" />}
                        {p.seller.kyc && <VerifiedBadge type="kyc" />}
                      </div>
                    </div>
                    <Stars r={p.seller.rating} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      ["⭐ Seller Rating", `${p.seller.rating}/5 (${(p.seller.ratings/1000).toFixed(1)}k ratings)`],
                      ["📦 Total Sales",   p.seller.sales],
                      ["⚡ Response Time", p.seller.response],
                      ["📅 On BuildKart",  `Since ${p.seller.since}`],
                    ].map(([l,v]) => (
                      <div key={l} className="bg-bk-surface rounded-xl p-3 border border-bk-border">
                        <p className="text-[10px] text-bk-muted">{l}</p>
                        <p className="text-xs font-bold text-bk-ink mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-3 py-2.5 border border-bk-blue text-bk-blue text-xs font-bold rounded-xl hover:bg-bk-blue hover:text-white transition-colors">💬 Chat with Seller</button>
                </div>
              )}
              {tab === "reviews" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-bk-surface rounded-2xl border border-bk-border">
                    <div className="text-center">
                      <p className="text-4xl font-black text-bk-ink">{p.rating.toFixed(1)}</p>
                      <Stars r={p.rating} />
                      <p className="text-[10px] text-bk-muted mt-0.5">{p.reviews.toLocaleString()} ratings</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5,4,3,2,1].map((star) => {
                        const pct = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2;
                        return <div key={star} className="flex items-center gap-2"><span className="text-[10px] w-3 text-bk-muted font-bold">{star}</span><div className="flex-1 bg-bk-border rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width:`${pct}%`, background:"#2F7F75" }} /></div><span className="text-[9px] text-bk-muted w-7">{pct}%</span></div>;
                      })}
                    </div>
                  </div>
                  {[
                    { user:"Ramesh K.", city:"Jaipur", rating:5, text:"Excellent quality! Local delivery in Jaipur by same evening. GST invoice was emailed instantly.", date:"22 Aug 2026" },
                    { user:"Priya S.", city:"Hyderabad", rating:4, text:"Good product. Seller was responsive. Minor packaging issue but resolved quickly.", date:"16 Aug 2026" },
                    { user:"Mahesh C.", city:"Mumbai", rating:5, text:"Great value. Exactly as described. Will order again. Fast delivery to Mumbai.", date:"8 Aug 2026" },
                  ].map((r, i) => (
                    <div key={i} className="border-b border-bk-border pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2"><span className="text-xs font-bold text-bk-ink">{r.user}</span><span className="text-[10px] text-bk-muted">{r.city}</span><span className="text-[9px] font-bold text-bk-blue">✓ Verified</span></div>
                        <div className="flex">{Array.from({length:5}).map((_,j) => <span key={j} className={`text-xs ${j<r.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>)}</div>
                      </div>
                      <p className="text-xs text-bk-ink2 leading-relaxed">{r.text}</p>
                      <p className="text-[10px] text-bk-muted mt-1">{r.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related */}
          {relatedProducts.length > 0 && (
            <div className="mt-3 mb-24 md:mb-6 px-3 md:px-0 py-3">
              <p className="text-sm font-black text-bk-ink mb-3">Similar Products</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {relatedProducts.map((x) => <PCard key={x.id} p={x} onClick={() => onAdd(x)} onAdd={(e) => { e.stopPropagation(); onAdd(x); }} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA — mobile */}
      <div className="md:hidden bg-bk-card border-t border-bk-border px-4 py-3 flex gap-3 flex-shrink-0 shadow-lg">
        <button onClick={handleAdd} className={`flex-1 py-3.5 rounded-2xl text-sm font-black transition-all shadow-md ${added ? "text-white" : "text-white"}`} style={{ background: added ? "#2F7F75" : "#2F7F75" }}>
          {added ? "✓ Added!" : "ADD TO CART"}
        </button>
        <button onClick={handleBuy} className="flex-1 py-3.5 rounded-2xl text-white text-sm font-black shadow-md" style={{ background: "#2F7F75" }}>BUY NOW</button>
      </div>
    </div>
  );
}

// ── Cart Page ─────────────────────────────────────────────────────────────────

function CartPage({ items, onRemove, onQty, onCheckout, onHome, user, onLogin }: { items: CartItem[]; onRemove: (id: number) => void; onQty: (id: number, d: number) => void; onCheckout: () => void; onHome: () => void; user: User|null; onLogin: () => void }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const saved    = items.reduce((s, i) => s + (i.product.mrp - i.product.price) * i.qty, 0);
  const delivery = subtotal >= 499 || items.length === 0 ? 0 : 49;
  const total    = subtotal + delivery;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-bk-card border-b border-bk-border px-4 md:px-6 py-3 flex-shrink-0 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={onHome} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
          <span className="font-black text-sm text-bk-ink">My Cart ({items.length} items)</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-7xl mb-4">🛒</div>
          <p className="font-black text-xl text-bk-ink">Your cart is empty</p>
          <p className="text-xs text-bk-muted mt-2">Add products to get started</p>
          <button onClick={onHome} className="mt-5 px-8 py-3 text-white font-black rounded-2xl text-sm shadow-lg" style={{ background: "#2F7F75" }}>Continue Shopping</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-bk-surface">
          <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:grid md:grid-cols-3 md:gap-6">
            {/* Items */}
            <div className="md:col-span-2 space-y-3">
              {saved > 0 && (
                <div className="rounded-xl px-4 py-2.5 flex items-center gap-2 border" style={{ background: "#EEF8F5", borderColor: "#2F7F75aa" }}>
                  <span>🎉</span><p className="text-xs font-bold" style={{ color: "#2F7F75" }}>You save {fmt(saved)} on this order!</p>
                </div>
              )}
              {items.map((item) => {
                const d = disc(item.product);
                return (
                  <div key={item.product.id} className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm">
                    <div className="flex gap-3">
                      <img src={item.product.img} alt={item.product.name} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl bg-gray-50 border border-bk-border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase" style={{ color: "#2F7F75" }}>{item.product.brand}</p>
                        <p className="text-xs font-semibold text-bk-ink leading-tight line-clamp-2 mt-0.5">{item.product.name}</p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-sm font-black text-bk-ink">{fmt(item.product.price)}</span>
                          {d > 0 && <><span className="text-[10px] text-bk-muted line-through">{fmt(item.product.mrp)}</span><span className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{d}% off</span></>}
                        </div>
                        <p className="text-[10px] font-medium mt-0.5" style={{ color: "#2F7F75" }}>✓ {item.product.delivery}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-bk-border">
                      <div className="flex items-center border border-bk-border rounded-xl overflow-hidden">
                        <button onClick={() => item.qty > 1 ? onQty(item.product.id,-1) : onRemove(item.product.id)} className="px-3 py-1.5 font-black text-bk-blue hover:bg-bk-surface text-sm">−</button>
                        <span className="px-4 py-1.5 text-sm font-black text-bk-ink border-x border-bk-border">{item.qty}</span>
                        <button onClick={() => onQty(item.product.id,1)} className="px-3 py-1.5 font-black text-bk-blue hover:bg-bk-surface text-sm">+</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-bk-ink">{fmt(item.product.price * item.qty)}</span>
                        <button onClick={() => onRemove(item.product.id)} className="text-[11px] font-bold border rounded-lg px-2.5 py-1.5 transition-colors hover:bg-red-50" style={{ color: "#C87272", borderColor: "#C8727244" }}>Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="md:col-span-1 mt-4 md:mt-0">
              <div className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm sticky top-4">
                <p className="text-sm font-black text-bk-ink mb-3">Price Details</p>
                <div className="space-y-2 text-xs">
                  {[["MRP Total", fmt(items.reduce((s,i)=>s+i.product.mrp*i.qty,0))],["Discount",`-${fmt(saved)}`],["Delivery",delivery===0?"FREE":fmt(delivery)]].map(([l,v],i) => (
                    <div key={l} className="flex justify-between text-bk-ink2">
                      <span>{l}</span>
                      <span className={`font-bold ${i===1?"text-bk-blue":i===2&&delivery===0?"text-bk-blue":""}`}>{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-bk-border pt-2 flex justify-between text-sm font-black text-bk-ink">
                    <span>Total Amount</span><span>{fmt(total)}</span>
                  </div>
                  {saved > 0 && <p className="text-[11px] font-bold" style={{ color: "#2F7F75" }}>🎉 You save {fmt(saved)}</p>}
                </div>
                {user ? (
                  <button onClick={onCheckout} className="w-full mt-4 py-4 text-white font-black text-sm rounded-2xl shadow-lg hover:opacity-90 transition-opacity" style={{ background: "#2F7F75" }}>
                    PROCEED TO CHECKOUT →
                  </button>
                ) : (
                  <div className="mt-4 space-y-2">
                    <button onClick={onLogin} className="w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg hover:opacity-90 transition-opacity" style={{ background: "#2F7F75" }}>
                      🔒 Login to Checkout →
                    </button>
                    <p className="text-[10px] text-bk-muted text-center">Sign in to place your order securely</p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mt-3">
                  {["🔒 Secure","✓ GST Invoice","↩ Easy Returns"].map((t) => <span key={t} className="text-[9px] text-bk-muted font-medium">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Checkout Flow ─────────────────────────────────────────────────────────────

function CheckoutPage({ items, onConfirm, onBack, user }: { items: CartItem[]; onConfirm: (orderId: string) => void; onBack: () => void; user: User|null }) {
  const [step, setStep] = useState<1|2|3>(1);
  const [addr, setAddr] = useState({ name: user?.name || "Rajesh Kumar", phone: user?.phone || "9876543210", line1:"Plot 42, Shanti Nagar", line2:"Near HDFC Bank", city: user?.city || "Jaipur", state:"Rajasthan", pin:"302001", type:"Home" as "Home"|"Office"|"Site" });
  const [pay, setPay] = useState<"upi"|"card"|"cod"|"netbanking">("upi");
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const gst      = Math.round(subtotal * 0.18);
  const delivery = subtotal >= 499 ? 0 : 49;
  const total    = subtotal + delivery;

  function placeOrder() {
    setPlacing(true);
    setTimeout(() => { onConfirm("BK" + Date.now().toString().slice(-8)); }, 1800);
  }

  const STEPS = [{ n:1, label:"Address" }, { n:2, label:"Payment" }, { n:3, label:"Review" }];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-bk-card border-b border-bk-border px-4 py-3 flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={step > 1 ? () => setStep((s) => (s - 1) as 1|2|3) : onBack} className="text-white/80 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span className="text-white font-black text-sm flex-1">Checkout</span>
          {/* Stepper */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s.n ? "bg-bk-teal text-white" : "bg-white/20 text-white/50"}`}>{step > s.n ? "✓" : s.n}</div>
                <span className={`text-[9px] font-bold ml-0.5 hidden md:inline ${step >= s.n ? "text-white" : "text-white/40"}`}>{s.label}</span>
                {i < 2 && <div className={`w-5 h-0.5 mx-1 rounded-full ${step > s.n ? "bg-bk-teal" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-bk-surface">
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-bk-card rounded-2xl p-5 border border-bk-border shadow-sm">
                <p className="text-sm font-black text-bk-ink mb-4">📍 Delivery Address</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {["Home","Office","Site"].map((t) => (
                    <button key={t} onClick={() => setAddr({...addr,type:t as typeof addr.type})} className={`py-2 text-xs font-bold rounded-xl border transition-all ${addr.type===t?"border-bk-blue bg-bk-mint text-bk-blue":"border-bk-border text-bk-muted hover:border-bk-blue"}`}>{t === "Home" ? "🏠" : t === "Office" ? "🏢" : "🏗️"} {t}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={addr.name} onChange={(e)=>setAddr({...addr,name:e.target.value})} placeholder="Full Name" className="border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                    <input value={addr.phone} onChange={(e)=>setAddr({...addr,phone:e.target.value})} placeholder="Mobile Number" className="border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                  </div>
                  <input value={addr.line1} onChange={(e)=>setAddr({...addr,line1:e.target.value})} placeholder="Address Line 1" className="w-full border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                  <input value={addr.line2} onChange={(e)=>setAddr({...addr,line2:e.target.value})} placeholder="Area / Landmark" className="w-full border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                  <div className="grid grid-cols-3 gap-3">
                    <input value={addr.city} onChange={(e)=>setAddr({...addr,city:e.target.value})} placeholder="City" className="border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                    <input value={addr.state} onChange={(e)=>setAddr({...addr,state:e.target.value})} placeholder="State" className="border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                    <input value={addr.pin} onChange={(e)=>setAddr({...addr,pin:e.target.value})} placeholder="Pincode" className="border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                  </div>
                </div>
                <button onClick={() => setStep(2)} className="w-full mt-4 py-3.5 text-white font-black text-sm rounded-2xl shadow-md" style={{ background: "#2F7F75" }}>Continue to Payment →</button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-bk-card rounded-2xl p-5 border border-bk-border shadow-sm">
                <p className="text-sm font-black text-bk-ink mb-4">💳 Payment Method</p>
                <div className="space-y-2.5">
                  {[
                    { id:"upi",        label:"UPI / QR Code",       sub:"GPay · PhonePe · Paytm · BHIM",    icon:"🟣" },
                    { id:"card",       label:"Credit / Debit Card",  sub:"Visa · Mastercard · RuPay",         icon:"💳" },
                    { id:"netbanking", label:"Net Banking",           sub:"All major Indian banks",            icon:"🏦" },
                    { id:"cod",        label:"Cash on Delivery",      sub:"Pay when delivered",               icon:"💵" },
                  ].map((m) => (
                    <label key={m.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${pay===m.id ? "border-bk-blue bg-bk-mint" : "border-bk-border hover:border-bk-blue"}`}>
                      <input type="radio" name="pay" checked={pay===m.id} onChange={()=>setPay(m.id as typeof pay)} className="accent-bk-blue" />
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-bk-ink">{m.label}</p>
                        <p className="text-[10px] text-bk-muted">{m.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {pay === "upi" && (
                  <div className="mt-3 flex gap-2">
                    <input placeholder="Enter UPI ID (eg. name@upi)" className="flex-1 border border-bk-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-bk-blue" />
                    <button className="px-4 py-2.5 bg-bk-blue text-white text-xs font-bold rounded-xl">Verify</button>
                  </div>
                )}
                <button onClick={() => setStep(3)} className="w-full mt-4 py-3.5 text-white font-black text-sm rounded-2xl shadow-md" style={{ background: "#2F7F75" }}>Review Order →</button>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm">
                  <p className="text-xs font-black text-bk-ink mb-3">📍 Deliver to</p>
                  <p className="text-xs font-bold text-bk-ink">{addr.name} · {addr.phone}</p>
                  <p className="text-xs text-bk-muted mt-0.5">{addr.line1}, {addr.line2}, {addr.city}, {addr.state} — {addr.pin}</p>
                  <p className="text-[10px] font-bold text-bk-blue mt-1 uppercase">{addr.type}</p>
                </div>
                <div className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm">
                  <p className="text-xs font-black text-bk-ink mb-3">🛒 Order Items ({items.length})</p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <img src={item.product.img} alt="" className="w-12 h-12 object-cover rounded-xl bg-gray-50 border border-bk-border flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{item.product.brand}</p>
                          <p className="text-xs text-bk-ink leading-tight line-clamp-1">{item.product.name}</p>
                          <p className="text-[10px] text-bk-muted">Qty: {item.qty}</p>
                        </div>
                        <p className="text-sm font-black text-bk-ink">{fmt(item.product.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={placeOrder} disabled={placing} className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all ${placing ? "opacity-70 cursor-wait" : "hover:opacity-90"}`} style={{ background: placing ? "#666" : "#2F7F75" }}>
                  {placing ? "⏳ Placing Order…" : `🎉 PLACE ORDER — ${fmt(total)}`}
                </button>
                <p className="text-[10px] text-bk-muted text-center">By placing order you agree to BuildKart's Terms & Conditions</p>
              </div>
            )}
          </div>

          {/* Order Summary sidebar */}
          <div className="md:col-span-1 mt-4 md:mt-0">
            <div className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm sticky top-4">
              <p className="text-xs font-black text-bk-ink mb-3">Order Summary</p>
              <div className="space-y-2 text-xs">
                {[["Items", fmt(subtotal)],["GST (18%)", fmt(gst)],["Delivery", delivery===0?"FREE":fmt(delivery)]].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-bk-ink2"><span>{l}</span><span className="font-bold">{v}</span></div>
                ))}
                <div className="border-t border-bk-border pt-2 flex justify-between text-sm font-black"><span>Total</span><span className="text-bk-blue">{fmt(total)}</span></div>
              </div>
              <div className="mt-3 space-y-1.5">
                {items.slice(0,3).map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2">
                    <img src={item.product.img} alt="" className="w-8 h-8 rounded-lg object-cover border border-bk-border" />
                    <p className="text-[10px] text-bk-ink line-clamp-1 flex-1">{item.product.name}</p>
                  </div>
                ))}
                {items.length > 3 && <p className="text-[10px] text-bk-muted">+{items.length-3} more items</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Confirmation ────────────────────────────────────────────────────────

function ConfirmPage({ orderId, items, onTrack, onHome }: { orderId: string; items: CartItem[]; onTrack: () => void; onHome: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface flex flex-col items-center justify-start py-8 px-4">
      <div className={`w-full max-w-md transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Success animation */}
        <div className="bg-bk-card rounded-3xl p-8 shadow-xl border border-bk-border text-center mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg animate-bounce" style={{ background: "#EEF8F5" }}>✅</div>
          <h1 className="text-2xl font-black text-bk-ink">Order Placed!</h1>
          <p className="text-bk-muted text-sm mt-1">Thank you for shopping with BuildKart</p>
          <div className="bg-bk-surface rounded-2xl px-5 py-3 mt-4 inline-block border border-bk-border">
            <p className="text-[10px] text-bk-muted font-medium">Order ID</p>
            <p className="text-base font-black text-bk-blue"># {orderId}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-bk-surface rounded-2xl p-3 border border-bk-border">
              <p className="text-[10px] text-bk-muted">Amount Paid</p>
              <p className="text-base font-black text-bk-ink">{fmt(total)}</p>
            </div>
            <div className="bg-bk-surface rounded-2xl p-3 border border-bk-border">
              <p className="text-[10px] text-bk-muted">Est. Delivery</p>
              <p className="text-sm font-black" style={{ color: "#2F7F75" }}>Mon–Wed</p>
            </div>
          </div>
        </div>

        {/* Ordered items */}
        <div className="bg-bk-card rounded-2xl p-4 shadow-sm border border-bk-border mb-4">
          <p className="text-xs font-black text-bk-ink mb-3">Items Ordered ({items.length})</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img src={item.product.img} alt="" className="w-14 h-14 object-cover rounded-xl border border-bk-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{item.product.brand}</p>
                  <p className="text-xs font-medium text-bk-ink line-clamp-1">{item.product.name}</p>
                  <p className="text-[10px] text-bk-muted">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-black text-bk-ink">{fmt(item.product.price * item.qty)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What's next */}
        <div className="bg-bk-card rounded-2xl p-4 shadow-sm border border-bk-border mb-6">
          <p className="text-xs font-black text-bk-ink mb-3">What happens next?</p>
          {[["📧","Email confirmation sent","to registered email"],["📱","SMS & WhatsApp","order & tracking updates"],["📦","Seller will pack","within 24 hours"],["🚚","Delivery partner","picks up and delivers"]].map(([icon,title,sub])=>(
            <div key={title} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div><p className="text-xs font-bold text-bk-ink">{title}</p><p className="text-[10px] text-bk-muted">{sub}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onTrack} className="w-full py-4 text-white font-black text-sm rounded-2xl shadow-lg" style={{ background: "#2F7F75" }}>📍 Track My Order</button>
          <button onClick={onHome} className="w-full py-3.5 font-black text-sm rounded-2xl border-2 border-bk-teal text-bk-teal hover:bg-bk-teal hover:text-white transition-colors">Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

// ── Order Tracking ────────────────────────────────────────────────────────────

function TrackPage({ orderId, items, onHome }: { orderId: string; items: CartItem[]; onHome: () => void }) {
  const STEPS = [
    { label:"Order Placed",        sub:`Order #${orderId} confirmed`, done:true,  time:"Today, 2:34 PM",        icon:"✅" },
    { label:"Seller Confirmed",    sub:"Seller accepted your order",  done:true,  time:"Today, 2:47 PM",        icon:"🏪" },
    { label:"Being Packed",        sub:"Items being quality-checked", done:true,  time:"Today, 3:15 PM",        icon:"📦" },
    { label:"Picked Up",           sub:"Handed to delivery partner",  done:true,  time:"Today, 5:00 PM",        icon:"🚚" },
    { label:"In Transit",          sub:"Delhivery — en route to you", done:false, time:"Expected tomorrow AM",   icon:"🗺️", current:true },
    { label:"Out for Delivery",    sub:"Delivery partner on the way", done:false, time:"Expected tomorrow 9–1", icon:"🛵" },
    { label:"Delivered",           sub:"Enjoy your purchase!",        done:false, time:"Expected tomorrow",     icon:"🎉" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      {/* Header */}
      <div className="px-4 py-4 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onHome} className="text-white/80 hover:text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
            <p className="font-black text-sm">Track Order</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-white/60">Order ID</p>
                <p className="font-black text-base">#{orderId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-bk-amber bg-bk-amber/20 px-2 py-0.5 rounded-full">In Transit</span>
                <p className="text-[10px] text-white/60 mt-1">{items.length} item{items.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
              <p className="text-[10px] text-white/60">Tracking ID</p>
              <p className="text-xs font-black font-mono text-white">DLVY{orderId.slice(-6)}2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Map placeholder */}
        <div className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden" style={{ height: 140 }}>
          <img src="https://images.unsplash.com/photo-1573119798379-011dfedae008?w=800&h=280&fit=crop&auto=format" alt="map" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center -mt-16">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-bk-border text-center">
              <p className="text-xs font-black text-bk-ink">🚚 Your order is on the way!</p>
              <p className="text-[10px] text-bk-muted">Expected delivery: <span className="font-bold text-bk-blue">Tomorrow by 1 PM</span></p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-bk-card rounded-2xl p-5 border border-bk-border shadow-sm">
          <p className="text-sm font-black text-bk-ink mb-4">Shipment Timeline</p>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-bk-border" />
            <div className="space-y-0">
              {STEPS.map((s, i) => (
                <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 shadow-sm ${s.done ? "border-bk-teal bg-bk-mint" : (s as any).current ? "border-bk-teal bg-bk-mint ring-4 ring-bk-teal/20" : "border-bk-border bg-bk-surface"}`}>
                    {s.done || (s as any).current ? s.icon : <span className="text-bk-muted text-[10px] font-black">{i+1}</span>}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-black ${s.done ? "text-bk-ink" : (s as any).current ? "text-bk-teal" : "text-bk-muted"}`}>{s.label}</p>
                      <p className={`text-[9px] font-medium ${s.done || (s as any).current ? "text-bk-muted" : "text-bk-border"}`}>{s.time}</p>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${s.done ? "text-bk-muted" : (s as any).current ? "text-bk-teal/80 font-semibold" : "text-bk-border"}`}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items in this shipment */}
        <div className="bg-bk-card rounded-2xl p-4 border border-bk-border shadow-sm">
          <p className="text-xs font-black text-bk-ink mb-3">Items in Shipment</p>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img src={item.product.img} alt="" className="w-12 h-12 object-cover rounded-xl border border-bk-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{item.product.brand}</p>
                  <p className="text-xs font-medium text-bk-ink line-clamp-1">{item.product.name}</p>
                  <p className="text-[10px] text-bk-muted">Qty: {item.qty}</p>
                </div>
                <p className="text-xs font-black">{fmt(item.product.price * item.qty)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button className="flex-1 py-3 border-2 border-bk-border text-bk-ink text-xs font-bold rounded-2xl hover:border-bk-blue transition-colors">📞 Call Delivery</button>
          <button className="flex-1 py-3 border-2 border-bk-blue text-bk-blue text-xs font-bold rounded-2xl hover:bg-bk-blue hover:text-white transition-colors">💬 Chat Support</button>
          <button onClick={onHome} className="flex-1 py-3 text-white text-xs font-bold rounded-2xl" style={{ background: "#2F7F75" }}>🏠 Home</button>
        </div>
      </div>
    </div>
  );
}

// ── Orders Page ───────────────────────────────────────────────────────────────

function OrdersPage({ onHome, onTrack }: { onHome: () => void; onTrack: () => void }) {
  const MOCK_ORDERS = [
    { id:"BK92847612", date:"24 Aug 2026", status:"In Transit",      statusColor:"#C8934A", items:[{ name:"Havells BLDC Fan 5★", brand:"Havells", img:"https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=80&h=80&fit=crop&auto=format", qty:1, price:3490 }], total:3490, tracking:"DLVY928476" },
    { id:"BK78341092", date:"18 Aug 2026", status:"Delivered",        statusColor:"#2F7F75", items:[{ name:"Jaquar Health Faucet Set", brand:"Jaquar", img:"https://images.unsplash.com/photo-1613849925387-6e7f31f0cf40?w=80&h=80&fit=crop&auto=format", qty:2, price:580 },{ name:"Dr. Fixit Waterproofing 20kg", brand:"Pidilite", img:"https://images.unsplash.com/photo-1674376360445-2996327553e7?w=80&h=80&fit=crop&auto=format", qty:1, price:1280 }], total:2440, tracking:"DLVY783411" },
    { id:"BK66190234", date:"10 Aug 2026", status:"Delivered",        statusColor:"#2F7F75", items:[{ name:"Bosch GSB 500W Drill 13mm", brand:"Bosch", img:"https://images.unsplash.com/photo-1606676539940-12768ce0e762?w=80&h=80&fit=crop&auto=format", qty:1, price:2180 }], total:2180, tracking:"DLVY661902" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-bk-surface">
      <div className="bg-bk-card border-b border-bk-border px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onHome} className="text-bk-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>
          <p className="font-black text-sm text-bk-ink">My Orders</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="bg-bk-card rounded-2xl border border-bk-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bk-border bg-bk-surface">
              <div>
                <p className="text-[11px] font-black text-bk-ink">#{order.id}</p>
                <p className="text-[10px] text-bk-muted">{order.date} · {order.items.length} item{order.items.length>1?"s":""}</p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ background: order.statusColor }}>{order.status}</span>
            </div>
            <div className="px-4 py-3 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.img} alt="" className="w-14 h-14 object-cover rounded-xl border border-bk-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold" style={{ color: "#2F7F75" }}>{item.brand}</p>
                    <p className="text-xs font-medium text-bk-ink line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-bk-muted">Qty: {item.qty} · {fmt(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-bk-border flex items-center justify-between">
              <p className="text-sm font-black text-bk-ink">{fmt(order.total)}</p>
              <div className="flex gap-2">
                <button onClick={onTrack} className="text-[10px] font-bold px-3 py-1.5 border border-bk-blue text-bk-blue rounded-xl hover:bg-bk-blue hover:text-white transition-colors">Track</button>
                {order.status === "Delivered" && <button className="text-[10px] font-bold px-3 py-1.5 border rounded-xl hover:bg-red-50 transition-colors" style={{ borderColor: "#C87272aa", color: "#C87272" }}>Return</button>}
                <button className="text-[10px] font-bold px-3 py-1.5 border border-bk-border text-bk-muted rounded-xl hover:border-bk-ink hover:text-bk-ink transition-colors">Invoice</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mode Picker ───────────────────────────────────────────────────────────────

function ModePicker({ user, onB2C, onB2B }: { user: User; onB2C: () => void; onB2B: () => void }) {
  return (
    <div className="fixed inset-0 z-[85] bg-bk-surface flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 shadow-sm" style={{ background: "linear-gradient(135deg,#2F7F75,#7CCFC1)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FAF8F3" }}>
          <span className="font-black text-sm" style={{ color: "#2F7F75" }}>BK</span>
        </div>
        <span className="text-white font-black text-base">BuildKart</span>
        <div className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "#FAF8F3", color: "#2F7F75" }}>{user.name.charAt(0)}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm" style={{ background: "#EEF8F5" }}>👋</div>
          <h1 className="text-2xl font-black text-bk-ink">Welcome, {user.name.split(" ")[0]}!</h1>
          <p className="text-sm text-bk-muted mt-1">How would you like to shop today?</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button onClick={onB2C} className="bg-bk-card border-2 border-bk-border rounded-3xl p-6 text-left hover:border-bk-teal hover:shadow-md transition-all active:scale-[0.98] group">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "#EEF8F5" }}>🛒</div>
              <div>
                <p className="text-base font-black text-bk-ink">Shop as Consumer</p>
                <p className="text-xs text-bk-muted">Browse, compare & buy products</p>
              </div>
              <svg className="ml-auto text-bk-muted group-hover:text-bk-blue transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Retail pricing","Easy checkout","Home delivery","GST invoice"].map((t) => (
                <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#EEF8F5", color: "#2F7F75" }}>✓ {t}</span>
              ))}
            </div>
          </button>

          <button onClick={onB2B} className="border-2 rounded-3xl p-6 text-left hover:shadow-md transition-all active:scale-[0.98] group" style={{ background: "linear-gradient(135deg,#EEF8F5,#fff)", borderColor: "#7CCFC1" }}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "#2F7F75" }}>🏢</div>
              <div>
                <p className="text-base font-black text-bk-ink">B2B Trade Account</p>
                <p className="text-xs text-bk-muted">Bulk pricing, RFQ & credit</p>
              </div>
              <svg className="ml-auto text-bk-teal group-hover:text-bk-blue transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Trade pricing","Bulk orders","RFQ & quotes","Credit account","GST invoice"].map((t) => (
                <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#2F7F75", color: "#fff" }}>✓ {t}</span>
              ))}
            </div>
            <div className="mt-3 text-[10px] font-bold" style={{ color: "#2F7F75" }}>Register your GSTIN · Get dealer / contractor rates →</div>
          </button>
        </div>

        <p className="text-[10px] text-bk-muted text-center mt-6">You can switch between modes anytime</p>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]   = useState<Screen>("home");
  const [catId,  setCatId]    = useState("electrical");
  const [product, setProduct] = useState<Product|null>(null);
  const [prevSc,  setPrevSc]  = useState<Screen>("home");
  const [cart,    setCart]    = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState("");
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [search,  setSearch]  = useState(false);
  const [user,    setUser]    = useState<User|null>(null);
  const [loginReturn, setLoginReturn] = useState<Screen>("home");
  const [showLogin, setShowLogin] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState("");
  const [mode, setMode] = useState<"pick" | "b2c" | "b2b" | null>(null);
  const [viewedIds, setViewedIds] = useState<number[]>([]);

  function go(s: Screen) { setPrevSc(screen); setScreen(s); }
  function openProduct(p: Product) {
    setProduct(p);
    go("product");
    sessionViewHistory.unshift(p.id);
    if (sessionViewHistory.length > 40) sessionViewHistory.pop();
    setViewedIds((prev) => {
      const next = [p.id, ...prev.filter((id) => id !== p.id)];
      return next.slice(0, 40);
    });
  }
  function openCat(id: string)     { setCatId(id); go("category"); }

  function addToCart(p: Product) {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.product.id === p.id);
      if (i >= 0) { const n=[...prev]; n[i]={...n[i],qty:n[i].qty+1}; return n; }
      return [...prev,{product:p,qty:1}];
    });
  }
  function removeFromCart(id: number) { setCart((p) => p.filter((x) => x.product.id !== id)); }
  function changeQty(id: number, d: number) { setCart((p) => p.map((x) => x.product.id===id ? {...x,qty:Math.max(1,x.qty+d)} : x)); }

  function onConfirm(id: string) { setOrderId(id); setOrderedItems([...cart]); setCart([]); setScreen("confirm"); }

  function handleLogin(u: User) {
    setUser(u);
    setShowLogin(false);
    setMode("pick");
  }

  function openLogin(returnTo: Screen = "home") {
    setLoginReturn(returnTo);
    setShowLogin(true);
  }

  function handleCheckout() {
    if (!user) { openLogin("checkout"); return; }
    go("checkout");
  }

  const cartCount = cart.reduce((s,i) => s+i.qty, 0);
  const hideChrome = ["checkout","confirm","track"].includes(screen);

  // B2B mode — hand off entirely to B2BApp
  if (mode === "b2b" && user) {
    return <B2BApp baseUser={{ name: user.name, phone: user.phone }} onSwitchB2C={() => setMode("pick")} />;
  }

  return (
    <div className="h-full flex flex-col bg-bk-surface" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Login overlay */}
      {showLogin && <LoginScreen onDone={handleLogin} onBack={() => setShowLogin(false)} />}

      {/* Mode picker overlay */}
      {mode === "pick" && user && (
        <ModePicker user={user} onB2C={() => setMode("b2c")} onB2B={() => setMode("b2b")} />
      )}

      {/* Search overlay */}
      {search && <SearchOverlay onClose={() => setSearch(false)} onProduct={(p) => { openProduct(p); setSearch(false); }} onAdd={addToCart} />}

      {/* Welcome toast */}
      {welcomeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-bk-ink text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xl animate-bounce whitespace-nowrap">
          {welcomeToast}
        </div>
      )}

      {!hideChrome && (
        <Header cartCount={cartCount} onSearch={() => setSearch(true)} onCart={() => go("cart")} onHome={() => setScreen("home")} user={user} onLogin={() => openLogin("home")} onOrders={() => go("orders")} />
      )}

      {screen === "home"     && <HomePage onCat={openCat} onProduct={openProduct} onAdd={addToCart} />}
      {screen === "category" && <CategoryPage catId={catId} onProduct={openProduct} onAdd={addToCart} onBack={() => setScreen("home")} viewedIds={viewedIds} />}
      {screen === "product"  && product && <ProductPage p={product} onBack={() => setScreen(prevSc)} onAdd={addToCart} onCart={() => go("cart")} />}
      {screen === "cart"     && <CartPage items={cart} onRemove={removeFromCart} onQty={changeQty} onCheckout={handleCheckout} onHome={() => setScreen("home")} user={user} onLogin={() => openLogin("checkout")} />}
      {screen === "checkout" && <CheckoutPage items={cart} onConfirm={onConfirm} onBack={() => setScreen("cart")} user={user} />}
      {screen === "confirm"  && <ConfirmPage orderId={orderId} items={orderedItems} onTrack={() => setScreen("track")} onHome={() => setScreen("home")} />}
      {screen === "track"    && <TrackPage orderId={orderId} items={orderedItems} onHome={() => setScreen("home")} />}
      {screen === "orders"   && <OrdersPage onHome={() => setScreen("home")} onTrack={() => setScreen("track")} />}

      {!hideChrome && (
        <BottomNav active={screen} onChange={(s) => { setPrevSc(screen); setScreen(s); }} cartCount={cartCount} user={user} onLogin={() => openLogin("home")} />
      )}

      {/* Switch to B2B button (visible when logged in as B2C) */}
      {user && mode === "b2c" && (
        <div className="hidden md:block fixed bottom-4 right-4 z-40">
          <button onClick={() => setMode("pick")} className="bg-bk-card border-2 border-bk-border rounded-2xl px-4 py-2.5 text-xs font-bold text-bk-ink2 shadow-lg hover:border-bk-teal hover:text-bk-blue transition-all">
            🏢 Switch to B2B Trade
          </button>
        </div>
      )}
    </div>
  );
}
