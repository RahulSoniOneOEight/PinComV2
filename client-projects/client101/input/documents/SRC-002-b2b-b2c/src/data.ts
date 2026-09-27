export interface Category {
  id: string; label: string; icon: string; color: string; subcats: string[]; brands: string[];
}
export interface Product {
  id: number; cat: string; subcat: string; brand: string; name: string;
  price: number; mrp: number; rating: number; reviews: number; img: string;
  badge?: string; delivery: string; highlights: string[];
  seller: Seller;
}
export interface Seller {
  name: string; city: string; rating: number; ratings: number;
  sales: string; response: string; gst: boolean; kyc: boolean; since: string;
}
export interface CartItem { product: Product; qty: number; }

// ── Image pools ─────────────────────────────────────────────────────────────
const Q = "?w=480&h=480&fit=crop&auto=format";
const I = {
  // Fans
  fan1:        "https://images.unsplash.com/photo-1677959098115-1aafeb9313c0"+Q,
  fan2:        "https://images.unsplash.com/photo-1576503963299-fcd31822b523"+Q,
  fan3:        "https://images.unsplash.com/photo-1632394128474-b8c3dca00f83"+Q,
  fan4:        "https://images.unsplash.com/photo-1518709414768-a88981a4515d"+Q,
  // LED Bulbs & Lighting
  bulb1:       "https://images.unsplash.com/photo-1730472067563-1a2a4db1b7d9"+Q,
  bulb2:       "https://images.unsplash.com/photo-1641393260685-14d43f6c6eb6"+Q,
  bulb3:       "https://images.unsplash.com/photo-1734330258845-7ec3b25a8f6a"+Q,
  bulb4:       "https://images.unsplash.com/photo-1603544555255-59a72593c33b"+Q,
  // Wires & Cables
  wire1:       "https://images.unsplash.com/photo-1687038520579-8d8f24721267"+Q,
  wire2:       "https://images.unsplash.com/photo-1687038520563-2310e8b06ed2"+Q,
  wire3:       "https://images.unsplash.com/photo-1761507320645-b11a00bfcc34"+Q,
  wire4:       "https://images.unsplash.com/photo-1645651964715-d200ce0939cc"+Q,
  // Kitchen Appliances
  kitchen1:    "https://images.unsplash.com/photo-1693875161720-b0c2401c1874"+Q,
  kitchen2:    "https://images.unsplash.com/photo-1693875161668-5c4ae0f2bf20"+Q,
  kitchen3:    "https://images.unsplash.com/photo-1527195575508-5b138d14a35b"+Q,
  kitchen4:    "https://images.unsplash.com/photo-1639405069836-f82aa6dcb900"+Q,
  // Plumbing — Faucets & Taps
  faucet1:     "https://images.unsplash.com/photo-1542855368-ca6ea825bca2"+Q,
  faucet2:     "https://images.unsplash.com/photo-1623111771733-d3ab4d26ce41"+Q,
  faucet3:     "https://images.unsplash.com/photo-1773177930141-4159d1cf900c"+Q,
  faucet4:     "https://images.unsplash.com/photo-1613849925387-6e7f31f0cf40"+Q,
  // Plumbing — Showers
  shower1:     "https://images.unsplash.com/photo-1652662700928-5a4685e87d64"+Q,
  shower2:     "https://images.unsplash.com/photo-1561361398-d1f7b6cfee79"+Q,
  shower3:     "https://images.unsplash.com/photo-1698724624855-e9dbc5a0bddb"+Q,
  // Plumbing — Basins & Pipes
  basin1:      "https://images.unsplash.com/photo-1644916925497-109cbd92087d"+Q,
  basin2:      "https://images.unsplash.com/photo-1576698483491-8c43f0862543"+Q,
  // Sanitaryware — WC / Toilets
  wc1:         "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14"+Q,
  wc2:         "https://images.unsplash.com/photo-1643949700215-e61cdca053f7"+Q,
  wc3:         "https://images.unsplash.com/photo-1569597967185-cd6120712154"+Q,
  // Sanitaryware — Bathtubs & Bathroom
  bathtub1:    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd"+Q,
  bathtub2:    "https://images.unsplash.com/photo-1733426107854-ee00a25d72a7"+Q,
  bathtub3:    "https://images.unsplash.com/photo-1642755622932-d1e0cb783dc5"+Q,
  bathtub4:    "https://images.unsplash.com/photo-1644068298141-6333cb147520"+Q,
  bathroom1:   "https://images.unsplash.com/photo-1644421439741-712c7fde7e95"+Q,
  bathroom2:   "https://images.unsplash.com/photo-1644916925497-109cbd92087d"+Q,
  // Paints & Construction
  paint1:      "https://images.unsplash.com/photo-1674376360445-2996327553e7"+Q,
  paint2:      "https://images.unsplash.com/photo-1688372199140-cade7ae820fe"+Q,
  paint3:      "https://images.unsplash.com/photo-1482731215275-a1f151646268"+Q,
  construction1:"https://images.unsplash.com/photo-1674649207083-281c2517ab49"+Q,
  // Power Tools
  drill1:      "https://images.unsplash.com/photo-1606676539940-12768ce0e762"+Q,
  drill2:      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407"+Q,
  drill3:      "https://images.unsplash.com/photo-1590635023142-73c3d34f2805"+Q,
  grinder1:    "https://images.unsplash.com/photo-1564182998523-6923112e7d6b"+Q,
  grinder2:    "https://images.unsplash.com/photo-1564182842519-8a3b2af3e228"+Q,
  // Hand Tools & Locks
  handtool1:   "https://images.unsplash.com/photo-1581166397057-235af2b3c6dd"+Q,
  handtool2:   "https://images.unsplash.com/photo-1503789146722-cf137a3c0fea"+Q,
  handtool3:   "https://images.unsplash.com/photo-1581783898377-1c85bf937427"+Q,
  lock1:       "https://images.unsplash.com/photo-1555529902-5261145633bf"+Q,
  lock2:       "https://images.unsplash.com/photo-1635602739175-bab409a6e94c"+Q,
  // Agriculture
  agri1:       "https://images.unsplash.com/photo-1645727527942-f12e14a0c841"+Q,
  agri2:       "https://images.unsplash.com/photo-1738598665698-7fd7af4b5e0c"+Q,
  agri3:       "https://images.unsplash.com/photo-1738598665806-7ecc32c3594c"+Q,
  agri4:       "https://images.unsplash.com/photo-1640677117376-573b9dbb8ea8"+Q,
  agri5:       "https://images.unsplash.com/photo-1692369584496-3216a88f94c1"+Q,
  agri6:       "https://images.unsplash.com/photo-1704162485983-7b5cf81894e1"+Q,
  agri7:       "https://images.unsplash.com/photo-1573119798379-011dfedae008"+Q,
  agri8:       "https://images.unsplash.com/photo-1606739211185-2c846d734a6d"+Q,
};

// ── Sellers ──────────────────────────────────────────────────────────────────
const SELLERS: Record<string, Seller> = {
  jaquar:    { name:"Jaquar Official Store",      city:"Bhiwadi, Rajasthan",    rating:4.7, ratings:18400, sales:"1.2L+", response:"< 1 hr",  gst:true, kyc:true, since:"2014" },
  cera:      { name:"Cera Sanitaryware Ltd",       city:"Morbi, Gujarat",        rating:4.5, ratings:9800,  sales:"85K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2016" },
  kohler:    { name:"Kohler India Official",       city:"Mumbai, Maharashtra",   rating:4.8, ratings:6200,  sales:"42K+",  response:"< 1 hr",  gst:true, kyc:true, since:"2012" },
  toto:      { name:"TOTO India Premium",          city:"New Delhi",             rating:4.9, ratings:3100,  sales:"18K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2018" },
  duravit:   { name:"Duravit India GmbH",          city:"Bengaluru, Karnataka",  rating:4.8, ratings:2800,  sales:"14K+",  response:"< 3 hrs", gst:true, kyc:true, since:"2017" },
  roca:      { name:"Roca Parryware India",        city:"Chennai, Tamil Nadu",   rating:4.4, ratings:7200,  sales:"56K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2015" },
  havells:   { name:"Havells India Official",      city:"Noida, Uttar Pradesh",  rating:4.7, ratings:24000, sales:"2.8L+", response:"< 1 hr",  gst:true, kyc:true, since:"2013" },
  orient:    { name:"Orient Electric Ltd",         city:"New Delhi",             rating:4.6, ratings:14000, sales:"1.6L+", response:"< 2 hrs", gst:true, kyc:true, since:"2015" },
  crompton:  { name:"Crompton Greaves India",      city:"Mumbai, Maharashtra",   rating:4.5, ratings:12000, sales:"1.1L+", response:"< 2 hrs", gst:true, kyc:true, since:"2014" },
  philips:   { name:"Philips India Ltd",           city:"Gurugram, Haryana",     rating:4.8, ratings:32000, sales:"3.4L+", response:"< 1 hr",  gst:true, kyc:true, since:"2012" },
  syska:     { name:"SSYL Syska LED Official",     city:"Mumbai, Maharashtra",   rating:4.4, ratings:9800,  sales:"95K+",  response:"< 3 hrs", gst:true, kyc:true, since:"2017" },
  bajaj:     { name:"Bajaj Electricals Ltd",       city:"Mumbai, Maharashtra",   rating:4.5, ratings:16000, sales:"1.8L+", response:"< 2 hrs", gst:true, kyc:true, since:"2013" },
  polycab:   { name:"Polycab India Ltd",           city:"Daman",                 rating:4.6, ratings:11000, sales:"1.3L+", response:"< 2 hrs", gst:true, kyc:true, since:"2015" },
  asian:     { name:"Asian Paints Official",       city:"Mumbai, Maharashtra",   rating:4.7, ratings:21000, sales:"2.4L+", response:"< 1 hr",  gst:true, kyc:true, since:"2013" },
  berger:    { name:"Berger Paints India",         city:"Kolkata, West Bengal",  rating:4.6, ratings:12000, sales:"1.1L+", response:"< 2 hrs", gst:true, kyc:true, since:"2015" },
  pidilite:  { name:"Pidilite Industries",         city:"Mumbai, Maharashtra",   rating:4.7, ratings:18000, sales:"2.1L+", response:"< 1 hr",  gst:true, kyc:true, since:"2013" },
  bosch:     { name:"Bosch Power Tools India",     city:"Bengaluru, Karnataka",  rating:4.7, ratings:19000, sales:"1.9L+", response:"< 1 hr",  gst:true, kyc:true, since:"2012" },
  stanley:   { name:"Stanley Black+Decker India",  city:"Pune, Maharashtra",     rating:4.6, ratings:11000, sales:"98K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2015" },
  godrej:    { name:"Godrej Locks Official",       city:"Mumbai, Maharashtra",   rating:4.8, ratings:22000, sales:"2.5L+", response:"< 1 hr",  gst:true, kyc:true, since:"2013" },
  kirloskar: { name:"Kirloskar Brothers Ltd",      city:"Pune, Maharashtra",     rating:4.6, ratings:8400,  sales:"72K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2014" },
  jain:      { name:"Jain Irrigation Systems",    city:"Jalgaon, Maharashtra",  rating:4.5, ratings:6200,  sales:"58K+",  response:"< 3 hrs", gst:true, kyc:true, since:"2015" },
  netafim:   { name:"Netafim India Pvt Ltd",       city:"Bengaluru, Karnataka",  rating:4.7, ratings:4100,  sales:"34K+",  response:"< 2 hrs", gst:true, kyc:true, since:"2016" },
  kisankraft:{ name:"KisanKraft Machine Tools",    city:"Bengaluru, Karnataka",  rating:4.3, ratings:5200,  sales:"44K+",  response:"< 3 hrs", gst:true, kyc:true, since:"2017" },
  grohe:     { name:"Grohe India Pvt Ltd",         city:"New Delhi",             rating:4.8, ratings:5800,  sales:"38K+",  response:"< 1 hr",  gst:true, kyc:true, since:"2015" },
  anchor:    { name:"Anchor Electricals Pvt",      city:"Mumbai, Maharashtra",   rating:4.3, ratings:8200,  sales:"82K+",  response:"< 3 hrs", gst:true, kyc:true, since:"2016" },
};

// ── Helper ────────────────────────────────────────────────────────────────────
function p(id:number,cat:string,subcat:string,brand:string,name:string,price:number,mrp:number,rating:number,reviews:number,img:string,delivery:string,highlights:string[],sellerKey:string,badge?:string):Product {
  return { id,cat,subcat,brand,name,price,mrp,rating,reviews,img,delivery,highlights,seller:SELLERS[sellerKey],badge };
}

// ── All Products ──────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  // ─── PLUMBING ──────────────────────────────────────────────────────────────
  p(1,"plumbing","Bib Cocks & Taps","Jaquar","Bib Cock 15mm Full Turn Chrome",485,680,4.4,2841,I.faucet1,"Free · Mon",["SS 304 body","15mm BSP thread","BIS certified","2-yr warranty"],"jaquar","Bestseller"),
  p(2,"plumbing","Bib Cocks & Taps","Cera","Pillar Tap Heavy Duty 15mm",320,460,4.2,1203,I.faucet4,"Free · Tue",["Brass body chrome","ISI marked","1-yr warranty","Overhead tank compatible"],"cera"),
  p(3,"plumbing","Mixers & Showers","Kohler","Single Lever Basin Mixer K-13901",4200,5800,4.7,987,I.faucet3,"Free · Wed",["Ceramic disc valve","360° swivel spout","Solid brass","5-yr warranty"],"kohler","Premium"),
  p(4,"plumbing","Mixers & Showers","Grohe","Rainshower Head 200mm 5 Spray",6800,9500,4.6,542,I.shower1,"Free · 4–6d",["Grohe DreamSpray","5 spray modes","Anti-lime system","StarLight chrome"],"grohe","Import"),
  p(5,"plumbing","Health Faucets","Jaquar","Health Faucet SS Hose 1.2m Set",580,780,4.3,4321,I.faucet2,"Free · Mon",["SS 304 spray head","1.2m hose","Wall bracket included","0.5–8 bar"],"jaquar","Bestseller"),
  p(6,"plumbing","Angle Valves","Cera","Angle Valve 15mm Quarter Turn",245,380,4.1,3102,I.faucet1,"Free · Tue",["Chrome-plated brass","ISI marked","Quarter-turn op","15mm BSP"],"cera"),
  p(7,"plumbing","Pipes & Fittings","Anchor","CPVC Pipe 15mm × 3m Hot-Cold",195,280,4.0,1870,I.wire4,"By Thu",["CPVC hot & cold","3m length","1.8 MPa rated","ISI marked"],"anchor"),
  p(8,"plumbing","Mixers & Showers","Kohler","Kitchen Sink Mixer Pull-Out K-780",8500,12500,4.8,312,I.faucet3,"Free · 4–5d",["Pull-out spray","Magnetic docking","DockNetik","GROHE Aqua Guide"],"kohler","Top Pick"),
  p(9,"plumbing","Mixers & Showers","Grohe","Thermostatic Shower Mixer Grohtherm",14500,19800,4.9,274,I.shower3,"Free · 4–5d",["±1°C control","Anti-scald","Smart Control","Chrome"],"grohe","Smart"),
  p(10,"plumbing","Health Faucets","Cera","Flexible SS Connector 40cm Pair",165,248,4.2,4560,I.faucet2,"Free · Tue",["SS braided hose","EPDM inner","40cm","Pair of 2"],"cera"),
  p(11,"plumbing","Angle Valves","Jaquar","Concealed Stop Valve 15mm CP",680,950,4.4,1102,I.faucet4,"Free · Mon",["Concealed body","Chrome plate","5-yr warranty","15mm BSP"],"jaquar"),
  p(12,"plumbing","Pipes & Fittings","Anchor","UPVC Elbow 90° 25mm — 10pc",85,135,4.1,2300,I.wire2,"By Thu",["UPVC material","90° bend","Solvent weld","10 pcs pack"],"anchor"),
  p(13,"plumbing","Bib Cocks & Taps","Grohe","Eurocube Kitchen Tap Dual Spray",11200,15800,4.7,188,I.faucet3,"Free · 4–5d",["Dual spray function","L-spout design","EcoJoy 5L/min","Chrome finish"],"grohe","Luxury"),
  p(14,"plumbing","Mixers & Showers","Jaquar","Overhead Shower 8\" Round Rain",1200,1800,4.4,1102,I.shower2,"Free · Mon",["8 inch round","Arm & flange included","Anti-lime nozzles","Chrome"],"jaquar"),
  p(15,"plumbing","Pipes & Fittings","Cera","Gate Valve ISI Mark 25mm",180,265,4.0,921,I.wire3,"Free · Tue",["Cast iron body","ISI 778","Hand wheel","25mm"],"cera"),
  p(16,"plumbing","Angle Valves","Anchor","Float Valve 15mm Brass Low-P",95,148,3.9,780,I.faucet1,"By Thu",["Brass body","Low-pressure","15mm BSP","ISI marked"],"anchor"),

  // ─── ELECTRICALS (expanded) ────────────────────────────────────────────────
  p(17,"electrical","Ceiling Fans","Havells","Efficiencia Neo 1200mm BLDC 5★",3490,4500,4.6,8241,I.fan1,"Free · Mon",["BLDC 28W","5-star BEE","Remote included","2-yr warranty"],"havells","5 Star"),
  p(18,"electrical","Ceiling Fans","Orient","Aeroslim Smart Wi-Fi Fan 1200mm",4200,5500,4.5,3102,I.fan2,"Free · Mon",["Works Alexa/Google","BLDC 35W","LED tri-colour light","App control"],"orient","Smart"),
  p(19,"electrical","Ceiling Fans","Crompton","Energion Cromair 1200mm BLDC",3190,4200,4.4,5421,I.fan3,"Free · Tue",["BLDC 28W motor","Remote + app","5-star rated","Anti-rust bearing"],"crompton"),
  p(20,"electrical","Ceiling Fans","Bajaj","Maxima 1200mm 3-Blade Ceiling Fan",1890,2600,4.1,6100,I.fan4,"Free · Tue",["1200mm sweep","3-speed regulator","2-yr warranty","ISI marked"],"bajaj"),
  p(21,"electrical","Ceiling Fans","Philips","AmbiancePro BLDC 1200mm 5★",3850,5000,4.5,2840,I.fan1,"Free · Mon",["BLDC 30W","5-star","Remote","Dimmable LED"],"philips","Premium"),
  p(22,"electrical","Table Fans","Crompton","High Flo 400mm Table Fan 3-Speed",1890,2600,4.3,5421,I.fan2,"Free · Tue",["400mm blade","3 speed","1-yr warranty","Thermal fuse"],"crompton"),
  p(23,"electrical","Table Fans","Orient","Wind Storm 450mm Stand Fan",2100,2900,4.2,1892,I.fan3,"Free · Mon",["450mm blade","90° oscillation","3 speeds","Height 90–120cm"],"orient"),
  p(24,"electrical","LED Bulbs","Philips","LED Bulb 12W B22 Warm — 4pk",299,480,4.4,12340,I.bulb1,"Free · Mon",["12W = 100W","3000K warm","15,000hrs life","4-pack"],"philips","Pack of 4"),
  p(25,"electrical","LED Bulbs","Syska","LED Bulb 9W Cool Day White E27",89,148,4.2,9800,I.bulb2,"Free · Mon",["9W cool white","6500K","8,000hrs","Energy Star"],"syska"),
  p(26,"electrical","LED Bulbs","Havells","LED Bulb 15W E27 Cool Daylight",185,280,4.5,7200,I.bulb3,"Free · Mon",["15W = 125W equiv","6500K cool","12,000hrs","BEE 4★"],"havells"),
  p(27,"electrical","LED Tubes","Philips","LED Batten 20W 4ft Natural White",385,580,4.4,4120,I.bulb4,"Free · Mon",["20W 2000 lumens","4000K natural","No warm-up","3-yr warranty"],"philips"),
  p(28,"electrical","LED Tubes","Havells","Luminia Batten 36W 4ft Tri-Colour",580,820,4.3,2840,I.bulb1,"Free · Tue",["36W tri-colour","3000/4000/6500K","Flicker free","3-yr warranty"],"havells"),
  p(29,"electrical","LED Downlights","Bajaj","LED Recessed Downlight 9W Warm",280,420,4.2,2103,I.bulb2,"Free · Tue",["9W 810 lumens","3000K warm","IP20","2-yr warranty"],"bajaj"),
  p(30,"electrical","LED Downlights","Syska","SmartDim LED Downlight 12W RGB",680,980,4.1,1340,I.bulb3,"Free · Mon",["12W RGB+W","App control","Dim to 1%","2.4GHz"],"syska","Smart"),
  p(31,"electrical","LED Strips","Philips","Hue LED Strip 2m RGB Smart",2800,3800,4.4,3210,I.bulb4,"Free · Mon",["2m RGB strip","16M colours","Alexa/Google","Extension available"],"philips","Smart"),
  p(32,"electrical","LED Strips","Syska","RGB LED Strip 5m + Remote",1280,1900,4.1,3210,I.bulb2,"Free · Mon",["5m flexible","IR remote","Self-adhesive","Cuttable every 3 LEDs"],"syska"),
  p(33,"electrical","Kitchen Appliances","Bajaj","Mixer Grinder 750W 3 Jar Juicer",3200,4500,4.3,6800,I.kitchen1,"Free · Tue",["750W motor","3 stainless jars","Overload protector","2-yr warranty"],"bajaj","Bestseller"),
  p(34,"electrical","Kitchen Appliances","Crompton","Induction Cooktop 2000W Touch",2800,3900,4.2,4210,I.kitchen3,"Free · Tue",["2000W 8 preset","Touch control","Auto shut-off","2-yr warranty"],"crompton"),
  p(35,"electrical","Kitchen Appliances","Havells","OTG 28L Oven Toaster Grill",5800,7500,4.5,3100,I.kitchen4,"Free · Tue",["28L capacity","Convection mode","4 heating modes","2-yr warranty"],"havells"),
  p(36,"electrical","Kitchen Appliances","Philips","Hand Blender 650W HR2657",1850,2600,4.4,5400,I.kitchen2,"Free · Mon",["650W turbo","Stainless blade","Splashguard","5 speeds + pulse"],"philips"),
  p(37,"electrical","Wires & Cables","Polycab","FR Wire 1.5sqmm 90m Coil Red",1650,2200,4.6,4800,I.wire1,"Free · Tue",["1.5 sq mm FR PVC","Oxygen-free copper","90m coil","IS 694"],"polycab"),
  p(38,"electrical","Wires & Cables","Havells","Lifeline Cable 2.5sqmm 90m",2100,2800,4.5,3200,I.wire2,"Free · Tue",["2.5 sq mm PVC","FRLS rated","90m coil","IS 694"],"havells"),
  p(39,"electrical","Switches & Sockets","Havells","Crabtree 6A SP Modular Switch",95,148,4.2,6780,I.wire3,"Free · Tue",["PC material","Child safety","10-yr warranty","Modular fit"],"havells"),
  p(40,"electrical","Switches & Sockets","Orient","Smart Wi-Fi 6A Switch Module",780,1200,4.3,2210,I.wire4,"Free · Mon",["Alexa & Google","No hub","Schedule timer","Remote app"],"orient","Smart"),
  p(41,"electrical","MCBs","Havells","MCB 32A Single Pole C-Curve 6kA",285,420,4.5,3410,I.wire1,"Free · Tue",["32A rated","C-Curve","6kA breaking","IS 60898-1"],"havells"),
  p(42,"electrical","MCBs","Polycab","RCCB 25A 2P 30mA Earth Leakage",1850,2600,4.4,1890,I.wire3,"Free · Tue",["25A 2-pole","30mA sensitivity","IS 12640","Anti-fire"],"polycab"),
  p(43,"electrical","Exhaust Fans","Crompton","Exhaust Fan 6\" 1250 RPM",680,950,4.1,3102,I.fan4,"Free · Tue",["6 inch sweep","1250 RPM","250 m³/hr","Dust resistant"],"crompton"),
  p(44,"electrical","Exhaust Fans","Orient","Energy Star 8\" Exhaust Fan",1100,1600,4.3,1840,I.fan2,"Free · Mon",["8 inch","Energy saving","Timer control","Ball bearing"],"orient"),

  // ─── PREMIUM SANITARYWARE ──────────────────────────────────────────────────
  p(45,"sanitary","WC & Toilets","TOTO","Neorest NX2 Smart Toilet Washlet",185000,240000,4.9,342,I.bathroom1,"Free · 7–10d",["Auto flush","Heated seat ±5°C","Warm water bidet","Self-cleaning glaze"],"toto","Ultra Premium"),
  p(46,"sanitary","WC & Toilets","TOTO","Drake II Close Coupled WC S-Trap",28500,38000,4.8,821,I.wc1,"Free · 5–7d",["S-trap 300mm","Tornado flush","3/4.8L dual","10-yr warranty"],"toto","Premium"),
  p(47,"sanitary","WC & Toilets","Duravit","Starck 3 Wall-Hung WC Rimless",42000,58000,4.8,412,I.wc2,"Free · 6–8d",["Rimless WC","Hygiene glaze","Soft-close seat","Wall-hung"],"duravit","Designer"),
  p(48,"sanitary","WC & Toilets","Kohler","Veil Intelligent Toilet Seat",18000,24500,4.8,421,I.wc3,"Free · 5–7d",["Auto flush","Heated seat","Night light","Auto-open/close"],"kohler","Smart"),
  p(49,"sanitary","WC & Toilets","Jaquar","Wall-Hung WC Soft-Close Seat Dual",8500,12500,4.6,1204,I.wc2,"Free · 5–7d",["Wall-hung","Soft-close seat","Dual flush 3/6L","Anti-bacterial glaze"],"jaquar","Premium"),
  p(50,"sanitary","WC & Toilets","Roca","Debba Compact WC P-Trap White",4200,6500,4.3,2103,I.wc3,"Free · 5–7d",["P-trap 305mm","Vitreous china","6L flush","3-yr warranty"],"roca"),
  p(51,"sanitary","Wash Basins","Duravit","Happy D.2 Pedestal Basin 550mm",32000,44000,4.8,284,I.basin2,"Free · 6–8d",["550mm designer","Pedestal included","Overflow","Wondergliss coating"],"duravit","Designer"),
  p(52,"sanitary","Wash Basins","TOTO","Lavatory Vessel Bowl Countertop",22000,30000,4.7,312,I.basin1,"Free · 5–7d",["Vessel bowl","Countertop mount","SanaGloss glaze","Overflow"],"toto","Premium"),
  p(53,"sanitary","Wash Basins","Kohler","Spence Wall-Hung Basin 560mm",14500,19800,4.7,540,I.basin2,"Free · 5–7d",["560×430mm","Wall-hung","Centre hole","Vitreous china"],"kohler","Premium"),
  p(54,"sanitary","Wash Basins","Jaquar","Counter Basin Oval 500×390mm",6800,9500,4.5,921,I.basin1,"Free · 5–7d",["Counter-top oval","500×390mm","Anti-bacterial","10-yr warranty"],"jaquar"),
  p(55,"sanitary","Wash Basins","Roca","Debba Pedestal Basin 480mm",5200,7500,4.5,784,I.basin2,"Free · 5–7d",["480×430mm","Full pedestal","Overflow hole","IS 2556"],"roca"),
  p(56,"sanitary","Shower Systems","TOTO","TBW Thermostatic Shower System",85000,115000,4.9,128,I.shower1,"Free · 7–10d",["Thermostat ±1°C","Rain + body jets","Anti-scald","10-yr warranty"],"toto","Ultra Premium"),
  p(57,"sanitary","Shower Systems","Duravit","Shower Panel 5-Function Thermo",48000,64000,4.8,184,I.shower3,"Free · 6–8d",["5-function","Thermostatic","Glass panel","Chrome"],"duravit","Luxury"),
  p(58,"sanitary","Shower Systems","Kohler","Components Shower Panel 4-Way",16000,22500,4.7,188,I.shower2,"Free · 5–7d",["4 body jets + overhead","Thermostat","Diverter valve","Anti-scald"],"kohler","Premium"),
  p(59,"sanitary","Shower Systems","Jaquar","Rain Shower System Overhead 250mm",8500,12000,4.5,480,I.shower1,"Free · 5–7d",["250mm rain head","Thermostatic mixer","Arm included","Chrome"],"jaquar"),
  p(60,"sanitary","Bathtubs","Duravit","Paiova 5 Freestanding Bathtub 1700",195000,260000,4.9,64,I.bathtub1,"Free · 10–14d",["1700×750mm freestanding","DuraSteril coating","WhirlSpa jets","10-yr warranty"],"duravit","Ultra Premium"),
  p(61,"sanitary","Bathtubs","TOTO","FLOTATION SELF Oval Freestanding",145000,198000,4.8,88,I.bathtub2,"Free · 10–14d",["Oval freestanding","SanaGloss glaze","Integrated drain","Overflow"],"toto","Luxury"),
  p(62,"sanitary","Accessories","Duravit","Darling New Mirror Cabinet 650mm",28000,38000,4.7,214,I.bathtub3,"Free · 6–8d",["650×750mm","LED surround","Anti-steam","Soft-close hinges"],"duravit","Designer"),
  p(63,"sanitary","Accessories","Jaquar","Towel Rail Heated 600mm Chrome",12500,17000,4.6,380,I.bathroom1,"Free · 5–7d",["Electric heated","Chrome SS","600mm","Timer control"],"jaquar","Premium"),

  // ─── PAINTS & CONSTRUCTION ─────────────────────────────────────────────────
  p(64,"construction","Interior Paints","Asian Paints","Royale Gloss Interior Emulsion 20L",4850,6200,4.6,3421,I.paint1,"Free · Tue",["80–100 sqft/L coverage","Washable","Low VOC","1700+ shades"],"asian","Top Seller"),
  p(65,"construction","Interior Paints","Berger","Silk Luxury Interior Emulsion 20L",4200,5600,4.5,2103,I.paint2,"Free · Tue",["Silk smooth finish","Scrubbable","130 sqft/L","3-coat power"],"berger"),
  p(66,"construction","Exterior Paints","Asian Paints","Apex Ultima Exterior 10L",3200,4400,4.5,2840,I.paint3,"Free · Tue",["Weather guard 7yr","Algae & fungus proof","UV fade guard","100% acrylic"],"asian"),
  p(67,"construction","Exterior Paints","Dulux","Weathershield Exterior 10L",3850,5200,4.6,1203,I.paint2,"Free · Tue",["25-yr durability","Algae resistant","UV guard","100% acrylic"],"berger","Premium"),
  p(68,"construction","Waterproofing","Pidilite","Dr. Fixit Waterproofing 20kg",1280,1800,4.5,1892,I.construction1,"Free · Tue",["Flexible cementitious","Crack-bridging","Potable water safe","12–15 sqft/kg"],"pidilite","Bestseller"),
  p(69,"construction","Waterproofing","Berger","Cementex Waterproof Coating 5L",680,980,4.3,432,I.construction1,"Free · Tue",["2-component","Flexible film","Terrace & basement","Brush apply"],"berger"),
  p(70,"construction","Adhesives","Pidilite","Fevicol SH 1kg Synthetic Resin",380,520,4.6,12103,I.paint1,"Free · Mon",["Water-resistant bond","For wood/laminates","Solvent-free","1kg pack"],"pidilite","Bestseller"),
  p(71,"construction","Adhesives","Pidilite","Roff Tile Adhesive Premium 20kg",480,680,4.3,1430,I.construction1,"Free · Tue",["Polymer-modified","5–10mm thickness","60 min open time","3.5 sqm/bag"],"pidilite"),
  p(72,"construction","Wall Putty","Asian Paints","Birla White Wall Putty 40kg",1080,1480,4.3,1540,I.paint3,"Free · Wed",["White cement base","120–150 sqft/bag","Smooth finish","Moisture resistant"],"asian"),
  p(73,"construction","Wall Putty","Asian Paints","Texture Coat Coarse 4kg Sandy",780,1100,4.2,1020,I.paint2,"Free · Mon",["Coarse texture","Exterior walls","20–25 sqft/kg","UV stable"],"asian"),
  p(74,"construction","Grout & Sealants","Pidilite","Roff Starlike Grout 2kg Ivory",245,360,4.1,1892,I.paint1,"Free · Tue",["Cement + epoxy blend","1–8mm joints","Water resistant","Ivory shade"],"pidilite"),
  p(75,"construction","Grout & Sealants","Berger","Breathe Easy Low-VOC Emulsion 4L",1650,2200,4.4,762,I.paint3,"Free · Tue",["Near-zero VOC","Child & pet safe","Odour-free","Smooth matte"],"berger","Eco"),

  // ─── HARDWARE & TOOLS ──────────────────────────────────────────────────────
  p(76,"hardware","Power Tools","Bosch","GSB 500W Corded Impact Drill 13mm",2180,2800,4.6,8241,I.drill1,"Free · Mon",["500W motor","13mm keyless chuck","2800 RPM","2-function drill+impact"],"bosch","Bestseller"),
  p(77,"hardware","Power Tools","Bosch","GWS 850W Angle Grinder 125mm",4200,5800,4.7,3421,I.grinder1,"Free · Mon",["850W motor","125mm disc","Spindle lock","Restart protection"],"bosch"),
  p(78,"hardware","Power Tools","Stanley","Black+Decker 18V Cordless Drill 2 Batts",3850,5200,4.5,2103,I.drill3,"Free · Tue",["18V Li-ion ×2","21-clutch positions","13mm keyless","Case included"],"stanley","Cordless"),
  p(79,"hardware","Power Tools","Bosch","Laser Level GLL 3-80 Cross Line 360°",5800,8200,4.7,1430,I.drill2,"Free · Mon",["3 laser lines 360°","±0.2mm/m","IP54","Professional grade"],"bosch","Pro"),
  p(80,"hardware","Hand Tools","Stanley","25-Piece Screwdriver & Socket Set",1450,2100,4.5,3102,I.handtool1,"Free · Mon",["25 pcs in case","CrV bits","Bi-material handle","Lifetime guarantee"],"stanley","Value Kit"),
  p(81,"hardware","Hand Tools","Stanley","Retractable Tape Measure 8m × 25mm",385,580,4.6,7102,I.handtool2,"Free · Mon",["8m reach","25mm blade","Nylon-coated","Auto-return lock"],"stanley"),
  p(82,"hardware","Locks & Latches","Godrej","NavLock 3-Lever Deadbolt 50mm",580,780,4.4,5432,I.lock1,"Free · Mon",["Zinc alloy body","3 keys","Double-locking","BIS IS 8758"],"godrej","Bestseller"),
  p(83,"hardware","Locks & Latches","Godrej","Padlock Super Series 50mm SS",480,680,4.5,6230,I.lock2,"Free · Mon",["SS hardened shackle","Anti-pick","Solid brass","3 keys"],"godrej"),
  p(84,"hardware","Fasteners & Pliers","Stanley","Taparia Combination Pliers 8\"",285,420,4.4,4201,I.handtool3,"Free · Mon",["High-carbon steel","Bi-material grip","DIN 5746","Precision jaws"],"stanley"),
  p(85,"hardware","Fasteners & Pliers","Stanley","Combination Spanner Set 8-Piece CrV",780,1100,4.3,2140,I.handtool2,"Free · Mon",["CrV steel","8–19mm spanners","Mirror polished","DIN 3113"],"stanley"),

  // ─── AGRICULTURE ──────────────────────────────────────────────────────────
  p(86,"agriculture","Water Pumps","Kirloskar","Star-1 0.5HP Centrifugal Pump",4200,5500,4.5,712,I.agri6,"Free · 3–5d",["0.5HP 370W","Single phase","25m max head","Cast iron body"],"kirloskar","Bestseller"),
  p(87,"agriculture","Water Pumps","Kirloskar","Star-2 1HP Centrifugal Pump",6800,8800,4.6,481,I.agri5,"Free · 3–5d",["1HP 750W","Single phase","35m head","4500 LPH max flow"],"kirloskar"),
  p(88,"agriculture","Water Pumps","Kirloskar","Mega-T 2HP Submersible Pump",18500,24000,4.5,284,I.agri6,"Free · 4–6d",["2HP 1500W","Submersible","60m head","SS body"],"kirloskar","Heavy Duty"),
  p(89,"agriculture","Drip Irrigation","Netafim","DripNet PC 16mm Drip Kit 1 Acre",12500,16800,4.7,312,I.agri2,"Free · 3–5d",["1 acre complete","PC drippers 2LPH","16mm lateral","Full installation kit"],"netafim","Complete Kit"),
  p(90,"agriculture","Drip Irrigation","Jain","Bhungroo Drip Irrigation 0.5 Acre",6800,9200,4.5,428,I.agri4,"Free · 3–5d",["0.5 acre kit","Micro drippers","63mm header","Screen filter included"],"jain"),
  p(91,"agriculture","Drip Irrigation","Netafim","Micro Sprinkler Kit 0.5 Acre",8400,11000,4.6,218,I.agri1,"Free · 3–5d",["0.5 acre sprinkler","360° coverage","Flow 35–90 LPH","Stake included"],"netafim"),
  p(92,"agriculture","Sprayers","KisanKraft","Power Sprayer 16L Battery 12V",2800,3800,4.3,892,I.agri7,"Free · 3–5d",["16L tank","12V 8Ah battery","6m hose","6 nozzle types"],"kisankraft","Bestseller"),
  p(93,"agriculture","Sprayers","KisanKraft","Knapsack Hand Pump Sprayer 16L",680,980,4.1,2103,I.agri3,"Free · 3–5d",["16L capacity","Hand pump","Adjustable nozzle","Chemical resistant"],"kisankraft"),
  p(94,"agriculture","Sprayers","KisanKraft","Petrol Power Sprayer 4-Stroke 26cc",8500,11500,4.4,312,I.agri8,"Free · 4–6d",["4-stroke 26cc","Multi-purpose","10m spray reach","15L tank"],"kisankraft","Pro"),
  p(95,"agriculture","Pipes & Fittings","Jain","HDPE Pipe 63mm PN6 100m Coil",4800,6500,4.4,540,I.agri3,"Free · 3–5d",["63mm PN6 HDPE","100m coil","PE 80 grade","IS 4984"],"jain"),
  p(96,"agriculture","Pipes & Fittings","Jain","Inline Drip Tape 16mm 100m",1800,2500,4.3,780,I.agri4,"Free · 3–5d",["16mm drip tape","30cm dripper spacing","100m roll","Pressure compensating"],"jain"),
  p(97,"agriculture","Agri Tools","KisanKraft","Petrol Tiller Cultivator 52cc 2-Stroke",18500,25000,4.4,184,I.agri8,"Free · 5–7d",["52cc 2-stroke","2-blade tiller","Foldable handle","6hr runtime"],"kisankraft","Heavy Duty"),
  p(98,"agriculture","Agri Tools","KisanKraft","Brush Cutter 52cc 2-Stroke Petrol",14500,19000,4.5,214,I.agri7,"Free · 5–7d",["52cc engine","Dual-line head","Anti-vibration","Harness included"],"kisankraft"),
  p(99,"agriculture","Agri Tools","KisanKraft","Garden Trowel & Pruner Combo Set",480,720,4.2,1240,I.handtool3,"Free · 3–5d",["Stainless steel trowel","Pruner & gloves","Hardened blade","Ergonomic grip"],"kisankraft"),
  p(100,"agriculture","Water Pumps","Kirloskar","Jalraaj 0.37kW Monoblock Pump",5400,7200,4.4,340,I.agri5,"Free · 3–5d",["0.37kW","Self-priming","Max 20m head","2400 LPH"],"kirloskar"),
  p(101,"agriculture","Drip Irrigation","Jain","Micro Tube Dripper 4LPH 1000pc",1200,1700,4.3,410,I.agri2,"Free · 3–5d",["4 LPH dripper","1000 pieces","Barbed fitting","UV stabilized"],"jain"),
  p(102,"agriculture","Pipes & Fittings","Netafim","Gateman Valve 63mm Manifold Kit",2800,3900,4.5,218,I.wire1,"Free · 3–5d",["63mm ball valve","Manifold included","Filter + injector","Full set"],"netafim"),
];

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id:"plumbing",     label:"Plumbing",          icon:"🔩", color:"#EEF8F5", subcats:["All","Bib Cocks & Taps","Mixers & Showers","Health Faucets","Angle Valves","Pipes & Fittings"], brands:["All","Jaquar","Cera","Kohler","Grohe","Anchor"] },
  { id:"electrical",   label:"Electricals",        icon:"⚡", color:"#FEF8E7", subcats:["All","Ceiling Fans","Table Fans","LED Bulbs","LED Tubes","LED Downlights","LED Strips","Kitchen Appliances","Wires & Cables","Switches & Sockets","MCBs","Exhaust Fans"], brands:["All","Havells","Orient","Crompton","Bajaj","Philips","Syska","Polycab"] },
  { id:"sanitary",     label:"Premium Sanitary",   icon:"🛁", color:"#EAF3FD", subcats:["All","WC & Toilets","Wash Basins","Shower Systems","Bathtubs","Accessories"], brands:["All","TOTO","Duravit","Kohler","Jaquar","Roca"] },
  { id:"construction", label:"Paints & Const",     icon:"🎨", color:"#FEF0E7", subcats:["All","Interior Paints","Exterior Paints","Waterproofing","Adhesives","Wall Putty","Grout & Sealants"], brands:["All","Asian Paints","Berger","Pidilite"] },
  { id:"hardware",     label:"Hardware & Tools",   icon:"🔧", color:"#F3F1FB", subcats:["All","Power Tools","Hand Tools","Locks & Latches","Fasteners & Pliers"], brands:["All","Bosch","Stanley","Godrej"] },
  { id:"agriculture",  label:"Agriculture",        icon:"🌾", color:"#EEF5EA", subcats:["All","Water Pumps","Drip Irrigation","Sprayers","Pipes & Fittings","Agri Tools"], brands:["All","Kirloskar","Netafim","Jain Irrigation","KisanKraft"] },
];

export const BANNERS = [
  { headline:"Big Construction Sale", sub:"Up to 55% off — Plumbing · Electricals · Tiles", cta:"Shop Now", grad:"#0B1E4B,#1A3A8F", img:"https://images.unsplash.com/photo-1644916925497-109cbd92087d?w=800&h=340&fit=crop&auto=format" },
  { headline:"Electricals Week", sub:"BLDC Fans · LED Lights · Kitchen Appliances", cta:"Explore Deals", grad:"#7B2D00,#F47B20", img:"https://images.unsplash.com/photo-1518709414768-a88981a4515d?w=800&h=340&fit=crop&auto=format" },
  { headline:"Premium Sanitaryware", sub:"TOTO · Duravit · Kohler — Luxury at Best Prices", cta:"Shop Premium", grad:"#1A0533,#7C3AED", img:"https://images.unsplash.com/photo-1733426107854-ee00a25d72a7?w=800&h=340&fit=crop&auto=format" },
  { headline:"Agriculture Season", sub:"Pumps · Drip Kits · Sprayers — Kisan Special Offers", cta:"Shop Farm", grad:"#064E3B,#10B981", img:"https://images.unsplash.com/photo-1692369584496-3216a88f94c1?w=800&h=340&fit=crop&auto=format" },
];
