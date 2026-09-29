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
