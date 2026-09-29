// Shared by the website (src/) and the mobile app (mobile/).
// Edit once, both apps get it.

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
];

export const SUPPORTED_LANGUAGES = LANGUAGES.map((l) => l.code);

// "fr-CA" -> "fr", "zh-Hans-CN" -> "zh", unknown -> "en"
export function pickLanguage(tag) {
  const base = String(tag || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : "en";
}

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "XOF", name: "CFA Franc (BCEAO)" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "CNY", name: "Chinese Yuan" },
];

// Used only if the live exchange-rate service can't be reached.
export const FALLBACK_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.37, XOF: 603,
  GNF: 8600, NGN: 1550, BRL: 5.4, MXN: 18.5, CNY: 7.2,
};

const REGION_CURRENCY = {
  US: "USD", CA: "CAD", GB: "GBP", MX: "MXN", BR: "BRL", CN: "CNY", NG: "NGN", GN: "GNF",
  FR: "EUR", DE: "EUR", ES: "EUR", PT: "EUR", IT: "EUR", BE: "EUR", NL: "EUR", AT: "EUR",
  IE: "EUR", LU: "EUR", FI: "EUR", GR: "EUR",
  SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF", NE: "XOF", TG: "XOF", BJ: "XOF", GW: "XOF",
};

export function currencyForRegion(region) {
  return REGION_CURRENCY[String(region || "").toUpperCase()] || "USD";
}

let ratesPromise = null;

// Live USD rates, fetched once per session.
export function getRates() {
  if (!ratesPromise) {
    ratesPromise = fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => (d && d.rates ? { ...FALLBACK_RATES, ...d.rates } : FALLBACK_RATES))
      .catch(() => FALLBACK_RATES);
  }
  return ratesPromise;
}

// Prices in the database are in USD.
export function formatMoney(amountUSD, currency = "USD", rates = FALLBACK_RATES, locale = "en") {
  const rate = rates[currency] || 1;
  const value = Number(amountUSD || 0) * rate;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: ["XOF", "GNF"].includes(currency) ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatUSD(amount, locale = "en") {
  return formatMoney(amount, "USD", FALLBACK_RATES, locale);
}

// Order tracking steps shown to the customer.
export const ORDER_STEPS = ["paid", "processing", "shipped", "delivered"];
export const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export const LEGAL_LAST_UPDATED = "2026-09-29";

// One-line address, used for checkout and orders.
export function formatAddress(a) {
  if (!a) return "";
  return [
    a.full_name,
    a.line1,
    a.line2,
    [a.postal_code, a.city].filter(Boolean).join(" "),
    a.state,
    a.country,
    a.phone,
  ]
    .filter(Boolean)
    .join(", ");
}

// Shipping carriers and their public tracking pages
export const CARRIERS = [
  { code: "usps", name: "USPS", url: "https://tools.usps.com/go/TrackConfirmAction?tLabels=" },
  { code: "ups", name: "UPS", url: "https://www.ups.com/track?tracknum=" },
  { code: "fedex", name: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr=" },
  { code: "dhl", name: "DHL", url: "https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=" },
  { code: "other", name: "Other", url: "https://parcelsapp.com/en/tracking/" },
];

export function carrierName(code) {
  return CARRIERS.find((c) => c.code === code)?.name || code || "";
}

export function trackingUrl(carrier, number) {
  if (!number) return null;
  const c = CARRIERS.find((x) => x.code === carrier) || CARRIERS[CARRIERS.length - 1];
  return c.url + encodeURIComponent(number);
}

// Staff roles (must match backend ROLE_PERMISSIONS)
export const STAFF_ROLES = ["admin", "product_manager", "seller"];

// ---------------------------------------------------------------------
// PRICES, SHIPPING, TAXES, DELIVERY
// (the backend has the same rules in backend/server.js — keep in sync)
// ---------------------------------------------------------------------

/** Sale price applies when set, lower than the price, and not expired */
export function isOnSale(p, now = Date.now()) {
  const sale = Number(p?.sale_price);
  if (!p || !(sale > 0) || !(sale < Number(p.price))) return false;
  return !p.sale_ends_at || new Date(p.sale_ends_at).getTime() > now;
}

export function effectivePrice(p) {
  return isOnSale(p) ? Number(p.sale_price) : Number(p?.price || 0);
}

export function discountPercent(p) {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
}

export const DEFAULT_SHOP_SETTINGS = {
  shipping: { standard_rate: 9.99, free_over: 50, zones: [], min_days: 3, max_days: 7 },
  taxes: { enabled: false, rates: [] },
};

const COUNTRY_ALIASES = {
  USA: "US", "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US", "ÉTATS-UNIS": "US", "ETATS-UNIS": "US",
  "UNITED KINGDOM": "GB", UK: "GB", FRANCE: "FR", CANADA: "CA", GUINEA: "GN", "GUINÉE": "GN", GUINEE: "GN",
  SENEGAL: "SN", "SÉNÉGAL": "SN", NIGERIA: "NG", GERMANY: "DE", ALLEMAGNE: "DE", SPAIN: "ES", ESPAGNE: "ES",
  BRAZIL: "BR", "BRÉSIL": "BR", MEXICO: "MX", CHINA: "CN", CHINE: "CN", "CÔTE D'IVOIRE": "CI", "COTE D'IVOIRE": "CI",
};

export function normalizeCountry(value) {
  const v = String(value || "").trim().toUpperCase();
  return COUNTRY_ALIASES[v] || v;
}

const US_STATES = {
  ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR", CALIFORNIA: "CA", COLORADO: "CO", CONNECTICUT: "CT",
  DELAWARE: "DE", FLORIDA: "FL", GEORGIA: "GA", HAWAII: "HI", IDAHO: "ID", ILLINOIS: "IL", INDIANA: "IN", IOWA: "IA",
  KANSAS: "KS", KENTUCKY: "KY", LOUISIANA: "LA", MAINE: "ME", MARYLAND: "MD", MASSACHUSETTS: "MA", MICHIGAN: "MI",
  MINNESOTA: "MN", MISSISSIPPI: "MS", MISSOURI: "MO", MONTANA: "MT", NEBRASKA: "NE", NEVADA: "NV", "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", OHIO: "OH",
  OKLAHOMA: "OK", OREGON: "OR", PENNSYLVANIA: "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT", VERMONT: "VT", VIRGINIA: "VA", WASHINGTON: "WA", "WEST VIRGINIA": "WV",
  WISCONSIN: "WI", WYOMING: "WY", "DISTRICT OF COLUMBIA": "DC",
};

export function normalizeState(value) {
  const v = String(value || "").trim().toUpperCase();
  return US_STATES[v] || v;
}

export function shippingCost(settings, country, subtotal) {
  const s = { ...DEFAULT_SHOP_SETTINGS.shipping, ...(settings?.shipping || {}) };
  if (Number(s.free_over) > 0 && subtotal >= Number(s.free_over)) return 0;
  const zone = (s.zones || []).find((z) => normalizeCountry(z.country) === normalizeCountry(country));
  return Number(zone ? zone.rate : s.standard_rate) || 0;
}

export function taxRate(settings, country, state) {
  const t = settings?.taxes;
  if (!t?.enabled) return 0;
  const c = normalizeCountry(country);
  const st = normalizeState(state);
  const rates = t.rates || [];
  const exact = rates.find((r) => normalizeCountry(r.country) === c && r.state && normalizeState(r.state) === st);
  const countryWide = rates.find((r) => normalizeCountry(r.country) === c && !r.state);
  return Number((exact || countryWide)?.rate) || 0;
}

/** Totals shown to the customer before paying */
export function quote(settings, subtotal, address) {
  const shipping = shippingCost(settings, address?.country, subtotal);
  const rate = taxRate(settings, address?.country, address?.state);
  const tax = Math.round(subtotal * rate) / 100;
  return { subtotal, shipping, taxRate: rate, tax, total: subtotal + shipping + tax };
}

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

/** "Oct 3 – Oct 6" style range */
export function deliveryRange(settings, locale = "en") {
  const s = { ...DEFAULT_SHOP_SETTINGS.shipping, ...(settings?.shipping || {}) };
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" });
  return {
    from: fmt.format(addBusinessDays(new Date(), Number(s.min_days) || 3)),
    to: fmt.format(addBusinessDays(new Date(), Number(s.max_days) || 7)),
  };
}

/** Countdown parts until a date, or null when passed */
export function timeLeft(until, now = Date.now()) {
  const ms = new Date(until).getTime() - now;
  if (!(ms > 0)) return null;
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
