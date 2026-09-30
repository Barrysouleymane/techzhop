require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const emails = require("./emails");

const app = express();

const IS_PROD = process.env.NODE_ENV === "production";
app.set("trust proxy", 1); // behind Render / Railway / Vercel proxies
app.disable("x-powered-by");

// Basic security headers (no extra package needed)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Simple in-memory rate limiter: rateLimit("checkout", 20, 10 * 60 * 1000)
const rateBuckets = new Map();
function rateLimit(name, max, windowMs) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    let b = rateBuckets.get(key);
    if (!b || now > b.reset) {
      b = { count: 0, reset: now + windowMs };
      rateBuckets.set(key, b);
    }
    b.count++;
    if (b.count > max) {
      res.setHeader("Retry-After", Math.ceil((b.reset - now) / 1000));
      return res.status(429).json({ error: "Too many requests, please try again in a moment." });
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rateBuckets) if (now > b.reset) rateBuckets.delete(k);
}, 60 * 1000).unref();

const PORT = process.env.PORT || 8000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";
// Main site address (first one) for links in emails / Stripe
const SITE_URL = FRONTEND_URL.split(",")[0].trim().replace(/\/$/, "");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET;

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is missing");
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is missing");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

console.log("");
console.log("========================================");
console.log("🚀 TECHZHOP API SERVER");
console.log("========================================");
console.log("Stripe: READY");
console.log("Supabase: READY");
console.log("Frontend:", FRONTEND_URL);
console.log("Port:", PORT);
console.log("========================================");
console.log("");


// ======================================================
// CORS
// ======================================================

// FRONTEND_URL can hold several sites, comma-separated:
// FRONTEND_URL=https://techzhop.com,https://www.techzhop.com
const ALLOWED_ORIGINS = [
  ...FRONTEND_URL.split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean),
  ...(IS_PROD ? [] : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]),
];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

// Global limit per IP (very generous — stops floods, not customers)
app.use(rateLimit("all", 600, 60 * 1000));


// ======================================================
// STRIPE WEBHOOK
//
// IMPORTANT:
// This route MUST be before express.json()
// because Stripe needs the raw request body.
// ======================================================

app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("");
    console.log("========================================");
    console.log("🔔 STRIPE WEBHOOK");
    console.log("========================================");

    let event;

    try {
      const signature = req.headers["stripe-signature"];

      if (!signature) {
        console.error("❌ Missing Stripe signature");

        return res.status(400).send("Missing Stripe signature");
      }

      if (!STRIPE_WEBHOOK_SECRET) {
        console.error("❌ STRIPE_WEBHOOK_SECRET is missing");

        return res.status(500).send(
          "Webhook secret is not configured"
        );
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );

      console.log("EVENT TYPE:", event.type);

    } catch (err) {
      console.error(
        "❌ WEBHOOK SIGNATURE ERROR:",
        err.message
      );

      return res.status(400).send(
        `Webhook Error: ${err.message}`
      );
    }

    try {
      // ==================================================
      // CHECKOUT COMPLETED
      // ==================================================

      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const result = await fulfillCheckoutSession(event.data.object.id);
        console.log("✅ CHECKOUT FULFILLED:", result.orderId || "not paid yet");
      }

      // ==================================================
      // ASYNC PAYMENT
      // ==================================================

      if (
        event.type ===
        "checkout.session.async_payment_succeeded"
      ) {
        console.log(
          "✅ ASYNC PAYMENT SUCCEEDED"
        );
      }

      // ==================================================
      // PAYMENT FAILED
      // ==================================================

      if (
        event.type ===
        "checkout.session.async_payment_failed"
      ) {
        const session = event.data.object;

        console.log(
          "❌ ASYNC PAYMENT FAILED:",
          session.id
        );
      }

      // ==================================================
      // EXPIRED CHECKOUT
      // ==================================================

      if (
        event.type ===
        "checkout.session.expired"
      ) {
        const session = event.data.object;

        console.log(
          "⚠️ CHECKOUT EXPIRED:",
          session.id
        );
      }

      return res.json({
        received: true,
      });

    } catch (err) {
      console.error(
        "❌ WEBHOOK PROCESSING ERROR:",
        err
      );

      return res.status(500).json({
        error: err.message,
      });
    }
  }
);


// ======================================================
// JSON MIDDLEWARE
// ======================================================

app.use(express.json({ limit: "15mb" }));


// ======================================================
// HOME
// ======================================================


// ======================================================
// PUSH NOTIFICATIONS (Expo)
// Sent to the mobile app when an order changes status,
// only if the customer kept "Order updates" enabled.
// ======================================================

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PUSH_TEXT = {
  en: { title: "Order #{id}", paid: "Payment received, thank you!", processing: "Your order is being prepared.", shipped: "Your order has shipped!", delivered: "Your order has been delivered.", cancelled: "Your order was cancelled.", pending: "Your order is pending." },
  fr: { title: "Commande n°{id}", paid: "Paiement reçu, merci !", processing: "Votre commande est en préparation.", shipped: "Votre commande a été expédiée !", delivered: "Votre commande a été livrée.", cancelled: "Votre commande a été annulée.", pending: "Votre commande est en attente." },
  es: { title: "Pedido n.º {id}", paid: "¡Pago recibido, gracias!", processing: "Estamos preparando tu pedido.", shipped: "¡Tu pedido ha sido enviado!", delivered: "Tu pedido ha sido entregado.", cancelled: "Tu pedido fue cancelado.", pending: "Tu pedido está pendiente." },
  pt: { title: "Pedido n.º {id}", paid: "Pagamento recebido, obrigado!", processing: "Seu pedido está sendo preparado.", shipped: "Seu pedido foi enviado!", delivered: "Seu pedido foi entregue.", cancelled: "Seu pedido foi cancelado.", pending: "Seu pedido está pendente." },
  de: { title: "Bestellung #{id}", paid: "Zahlung erhalten, danke!", processing: "Deine Bestellung wird vorbereitet.", shipped: "Deine Bestellung wurde versandt!", delivered: "Deine Bestellung wurde zugestellt.", cancelled: "Deine Bestellung wurde storniert.", pending: "Deine Bestellung ist ausstehend." },
  zh: { title: "订单 #{id}", paid: "已收到付款，谢谢！", processing: "您的订单正在准备中。", shipped: "您的订单已发货！", delivered: "您的订单已送达。", cancelled: "您的订单已取消。", pending: "您的订单待处理。" },
};

const DRIVER_PUSH = {
  en: { title: "TechZhop", newDelivery: "New delivery assigned: order #{id}" },
  fr: { title: "TechZhop", newDelivery: "Nouvelle livraison : commande n°{id}" },
  es: { title: "TechZhop", newDelivery: "Nueva entrega asignada: pedido #{id}" },
  pt: { title: "TechZhop", newDelivery: "Nova entrega atribuída: pedido #{id}" },
  de: { title: "TechZhop", newDelivery: "Neue Lieferung zugewiesen: Bestellung #{id}" },
  zh: { title: "TechZhop", newDelivery: "新的配送任务：订单 #{id}" },
};

const COURIER_PUSH = {
  en: { title: "Order #{id}", onTheWay: "{name} is on the way with your order. Delivery code: {code}" },
  fr: { title: "Commande n°{id}", onTheWay: "{name} arrive avec votre commande. Code de livraison : {code}" },
  es: { title: "Pedido n.º {id}", onTheWay: "{name} va en camino con tu pedido. Código de entrega: {code}" },
  pt: { title: "Pedido n.º {id}", onTheWay: "{name} está a caminho com seu pedido. Código de entrega: {code}" },
  de: { title: "Bestellung #{id}", onTheWay: "{name} ist mit deiner Bestellung unterwegs. Liefercode: {code}" },
  zh: { title: "订单 #{id}", onTheWay: "{name} 正在为您配送订单。取件码：{code}" },
};

/** Push to one user with a text table: sendPushTo(userId, DRIVER_PUSH, "newDelivery", { id: 12 }) */
async function sendPushTo(userId, table, key, vars = {}, data = {}) {
  try {
    if (!userId) return;
    const { data: tokens } = await supabase.from("push_tokens").select("token, language").eq("user_id", userId);
    if (!tokens?.length) return;
    const fillIn = (t) => String(t || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
    const messages = tokens.map(({ token, language }) => {
      const t = table[language] || table.en;
      return { to: token, sound: "default", title: fillIn(t.title), body: fillIn(t[key]), data };
    });
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("PUSH ERROR:", err.message);
  }
}

async function sendOrderPush(userId, orderId, status) {
  try {
    if (!userId || !status) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_orders")
      .eq("id", userId)
      .maybeSingle();

    if (profile && profile.notify_orders === false) return;

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token, language")
      .eq("user_id", userId);

    if (!tokens || tokens.length === 0) return;

    const messages = tokens.map(({ token, language }) => {
      const t = PUSH_TEXT[language] || PUSH_TEXT.en;
      return {
        to: token,
        sound: "default",
        title: t.title.replace("{id}", orderId),
        body: t[status] || status,
        data: { orderId },
      };
    });

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    console.log("📲 PUSH SENT:", userId, status);
  } catch (err) {
    console.error("PUSH ERROR:", err.message);
  }
}




// ======================================================
// PRICES, SHIPPING & TAXES
// (same rules as shared/settings.js used by the website and app)
// ======================================================

// Countries we sell in. Each one: payment methods ("card" = Stripe, "cod" = pay on delivery),
// local currency + fixed rate (1 USD = rate), own stock or shared stock,
// and the areas where our own drivers deliver (states, cities or postal-code prefixes).
const DEFAULT_COUNTRIES = {
  US: { enabled: true, currency: "USD", rate: 1, payments: ["card"], own_stock: false, local_delivery: { enabled: false, areas: ["NY"] }, min_days: 0, max_days: 0 },
  GN: { enabled: true, currency: "GNF", rate: 8600, payments: ["cod"], own_stock: true, local_delivery: { enabled: true, areas: ["Conakry"] }, min_days: 1, max_days: 3 },
};

const DEFAULT_SHOP_SETTINGS = {
  shipping: { standard_rate: 9.99, free_over: 50, zones: [], min_days: 3, max_days: 7 },
  taxes: { enabled: false, rates: [] },
  promo_bar: { enabled: false, text: "", ends_at: null, link: "" },
  countries: DEFAULT_COUNTRIES,
};

function isOnSale(p) {
  const sale = Number(p?.sale_price);
  if (!p || !(sale > 0) || !(sale < Number(p.price))) return false;
  return !p.sale_ends_at || new Date(p.sale_ends_at).getTime() > Date.now();
}

function effectivePrice(p) {
  return isOnSale(p) ? Number(p.sale_price) : Number(p?.price || 0);
}

const COUNTRY_ALIASES = {
  USA: "US", "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US", "ÉTATS-UNIS": "US", "ETATS-UNIS": "US",
  "UNITED KINGDOM": "GB", UK: "GB", FRANCE: "FR", CANADA: "CA", GUINEA: "GN", "GUINÉE": "GN", GUINEE: "GN",
  SENEGAL: "SN", "SÉNÉGAL": "SN", NIGERIA: "NG", GERMANY: "DE", ALLEMAGNE: "DE", SPAIN: "ES", ESPAGNE: "ES",
  BRAZIL: "BR", "BRÉSIL": "BR", MEXICO: "MX", CHINA: "CN", CHINE: "CN", "CÔTE D'IVOIRE": "CI", "COTE D'IVOIRE": "CI",
};
const normalizeCountry = (v) => {
  const x = String(v || "").trim().toUpperCase();
  return COUNTRY_ALIASES[x] || x;
};
const US_STATE_NAMES = {
  "NEW YORK": "NY", "NEW JERSEY": "NJ", CALIFORNIA: "CA", TEXAS: "TX", FLORIDA: "FL", PENNSYLVANIA: "PA",
  ILLINOIS: "IL", OHIO: "OH", GEORGIA: "GA", "NORTH CAROLINA": "NC", MICHIGAN: "MI", MASSACHUSETTS: "MA",
  WASHINGTON: "WA", VIRGINIA: "VA", MARYLAND: "MD", CONNECTICUT: "CT", "DISTRICT OF COLUMBIA": "DC",
};
const normalizeState = (v) => {
  const x = String(v || "").trim().toUpperCase();
  return US_STATE_NAMES[x] || x;
};

function shippingCost(settings, country, subtotal) {
  const s = { ...DEFAULT_SHOP_SETTINGS.shipping, ...(settings?.shipping || {}) };
  if (Number(s.free_over) > 0 && subtotal >= Number(s.free_over)) return 0;
  const zone = (s.zones || []).find((z) => normalizeCountry(z.country) === normalizeCountry(country));
  return Number(zone ? zone.rate : s.standard_rate) || 0;
}

function taxRate(settings, country, state) {
  const t = settings?.taxes;
  if (!t?.enabled) return 0;
  const c = normalizeCountry(country);
  const st = normalizeState(state);
  const rates = t.rates || [];
  const exact = rates.find((r) => normalizeCountry(r.country) === c && r.state && normalizeState(r.state) === st);
  const countryWide = rates.find((r) => normalizeCountry(r.country) === c && !r.state);
  return Number((exact || countryWide)?.rate) || 0;
}

/** Settings of one country, or null when we don't sell there */
function countryCfg(settings, country) {
  const c = normalizeCountry(country);
  const cfg = (settings?.countries || DEFAULT_COUNTRIES)[c];
  return cfg && cfg.enabled ? cfg : null;
}

/** Stock available for a country (null = unlimited) */
function stockFor(product, country, settings) {
  const c = normalizeCountry(country);
  const cfg = countryCfg(settings, c);
  if (cfg?.own_stock) {
    const map = product?.stock_by_country || {};
    return map[c] == null ? 0 : Number(map[c]);
  }
  return product?.stock == null ? null : Number(product.stock);
}

/** Add (+1) or remove (-1) quantities from the right stock */
async function adjustStock(items, country, sign, settings) {
  settings = settings || (await getShopSettings());
  const c = normalizeCountry(country);
  const own = !!countryCfg(settings, c)?.own_stock;
  for (const item of items || []) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity || 0) * sign;
    const { data: p } = await supabase.from("products").select("stock, stock_by_country").eq("id", item.product_id).maybeSingle();
    if (!p) continue;
    if (own) {
      const map = { ...(p.stock_by_country || {}) };
      map[c] = Math.max(0, Number(map[c] || 0) + qty);
      await supabase.from("products").update({ stock_by_country: map }).eq("id", item.product_id);
    } else if (p.stock != null) {
      await supabase.from("products").update({ stock: Math.max(0, Number(p.stock) + qty) }).eq("id", item.product_id);
    }
  }
}

/** Do our own drivers deliver to this address? */
function isLocalDelivery(settings, address) {
  const cfg = countryCfg(settings, address?.country);
  if (!cfg?.local_delivery?.enabled) return false;
  const areas = (cfg.local_delivery.areas || []).map((a) => String(a).trim().toUpperCase()).filter(Boolean);
  if (!areas.length) return true;
  const state = normalizeState(address?.state);
  const city = String(address?.city || "").trim().toUpperCase();
  const zip = String(address?.postal_code || "").trim().toUpperCase();
  return areas.some((a) => a === state || a === city || (zip && zip.startsWith(a)));
}

/** Amount in the country's currency (rounded to 500 for GNF / FCFA) */
function localAmount(cfg, usd) {
  const rate = Number(cfg?.rate) || 1;
  const v = Number(usd || 0) * rate;
  return rate >= 100 ? Math.round(v / 500) * 500 : Math.round(v * 100) / 100;
}

const newDeliveryCode = () => String(Math.floor(1000 + Math.random() * 9000));

let settingsCache = null;
let settingsAt = 0;

async function getShopSettings() {
  if (settingsCache && Date.now() - settingsAt < 30000) return settingsCache;
  const { data } = await supabase.from("shop_settings").select("value").eq("key", "shop").maybeSingle();
  settingsCache = {
    shipping: { ...DEFAULT_SHOP_SETTINGS.shipping, ...(data?.value?.shipping || {}) },
    taxes: { ...DEFAULT_SHOP_SETTINGS.taxes, ...(data?.value?.taxes || {}) },
    promo_bar: { ...DEFAULT_SHOP_SETTINGS.promo_bar, ...(data?.value?.promo_bar || {}) },
    countries: data?.value?.countries && Object.keys(data.value.countries).length ? data.value.countries : DEFAULT_COUNTRIES,
  };
  settingsAt = Date.now();
  return settingsCache;
}



// ======================================================
// USER INFO FOR EMAILS (email, name, language)
// ======================================================

async function userInfo(userId) {
  if (!userId) return null;
  const [{ data: authData }, { data: profile }] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.from("profiles").select("full_name, notify_orders").eq("id", userId).maybeSingle(),
  ]);
  const u = authData?.user;
  if (!u) return null;
  return {
    email: u.email,
    name: profile?.full_name || u.user_metadata?.full_name || "",
    language: u.user_metadata?.language || "en",
    notifyOrders: profile?.notify_orders !== false,
  };
}

const CARRIER_URLS = {
  usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  ups: "https://www.ups.com/track?tracknum=",
  fedex: "https://www.fedex.com/fedextrack/?trknbr=",
  dhl: "https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=",
  other: "https://parcelsapp.com/en/tracking/",
};
const trackingLink = (carrier, number) =>
  number ? (CARRIER_URLS[carrier] || CARRIER_URLS.other) + encodeURIComponent(number) : null;


// ======================================================
// ORDER CREATION AFTER PAYMENT
// Called by the Stripe webhook AND when the customer comes back
// from the payment page, so orders are saved even when Stripe
// can't reach this server (e.g. while developing on localhost).
// Safe to call several times for the same session.
// ======================================================

const fulfillingSessions = new Map();

function fulfillCheckoutSession(sessionId) {
  if (!fulfillingSessions.has(sessionId)) {
    const job = doFulfill(sessionId).finally(() => fulfillingSessions.delete(sessionId));
    fulfillingSessions.set(sessionId, job);
  }
  return fulfillingSessions.get(sessionId);
}

async function doFulfill(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { session, orderId: null };
  }

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) return { session, orderId: existing.id };

  const userId = session.metadata?.user_id || null;
  const now = new Date().toISOString();

  const orderRow = {
    user_id: userId,
    stripe_session_id: session.id,
    total: Number(session.amount_total || 0) / 100,
    shipping_address: session.metadata?.shipping_address || null,
    status: "paid",
    created_at: now,
    updated_at: now,
  };

  // Detailed amounts, when the columns exist (SQL "store features")
  const cols = await orderColumns();
  const amounts = {
    subtotal: Number(session.metadata?.subtotal || session.amount_subtotal / 100 || 0),
    shipping_amount: Number(session.total_details?.amount_shipping || 0) / 100,
    tax_amount: Number(session.metadata?.tax || 0),
    discount_amount: Number(session.total_details?.amount_discount || 0) / 100,
  };
  for (const [k, v] of Object.entries(amounts)) {
    if (cols.includes(k)) orderRow[k] = v;
  }

  // Country, payment and delivery details (SQL "countries")
  const settingsF = await getShopSettings();
  const orderCountry = normalizeCountry(session.metadata?.country || "US");
  let savedAddr = null;
  if (session.metadata?.address_id && userId) {
    const { data } = await supabase.from("addresses").select("*").eq("id", session.metadata.address_id).eq("user_id", userId).maybeSingle();
    savedAddr = data || null;
  }
  const addrForZone = savedAddr || { country: orderCountry, state: session.metadata?.state, city: session.metadata?.city, postal_code: session.metadata?.postal_code };
  const local = isLocalDelivery(settingsF, addrForZone);
  Object.assign(orderRow, pickCols(cols, {
    country: orderCountry,
    payment_method: "card",
    payment_status: "paid",
    currency: "USD",
    local_total: orderRow.total,
    delivery_mode: local ? "local" : "carrier",
    delivery_code: local ? newDeliveryCode() : null,
    customer_phone: savedAddr?.phone || session.customer_details?.phone || null,
    delivery_lat: savedAddr?.latitude ?? null,
    delivery_lng: savedAddr?.longitude ?? null,
  }));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderRow)
    .select()
    .single();

  if (orderError) {
    // Unique index hit: another request created it at the same time
    if (orderError.code === "23505") {
      const { data: again } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();
      return { session, orderId: again?.id || null };
    }
    throw orderError;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const orderItems = lineItems.data
    .filter((item) => item.price?.product?.metadata?.kind !== "tax")
    .map((item) => {
    const product = item.price?.product;
    const productId = Number(product?.metadata?.product_id) || null;
    return {
      order_id: order.id,
      product_id: productId,
      product_name: item.description || product?.name || "Product",
      price: Number(item.price?.unit_amount || 0) / 100,
      quantity: Number(item.quantity || 1),
      created_at: now,
    };
  });

  if (orderItems.length) {
    const { error } = await supabase.from("order_items").insert(orderItems);
    if (error) console.error("ORDER ITEMS ERROR:", error.message);
  }

  // Reduce stock (the country's own stock when it has one)
  await adjustStock(orderItems, orderCountry, -1, settingsF);

  // Empty the customer's cart
  if (userId) {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }

  console.log("🧾 ORDER CREATED:", order.id, "items:", orderItems.length);
  await sendOrderPush(userId, order.id, "paid");

  // Emails: confirmation to the customer + alert to the shop owners
  const info = await userInfo(userId).catch(() => null);
  const customerEmail = info?.email || session.customer_details?.email;
  emails.orderConfirmationEmail({
    to: customerEmail,
    name: info?.name || session.customer_details?.name,
    language: info?.language,
    order: { ...order, ...orderRow },
    items: orderItems,
  });
  if (ADMIN_EMAILS.length) {
    emails.newOrderAdminEmail({ to: ADMIN_EMAILS, order: { ...order, ...orderRow }, items: orderItems });
  }

  return { session, orderId: order.id };
}


// ======================================================
// AUTH HELPERS
// The frontend sends: Authorization: Bearer <supabase access token>
// ======================================================

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Login required" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------
// ROLES & PERMISSIONS
//   admin           → everything (products, orders, team, revenue)
//   product_manager → products, photos, categories, brands
//   seller          → orders (status, tracking)
//   customer        → no access to the admin area
// Emails in ADMIN_EMAILS are the shop owners: always admin,
// and their role can't be removed from the Team page.
// ------------------------------------------------------

const ROLE_PERMISSIONS = {
  admin: ["products", "orders", "team", "revenue", "store"],
  product_manager: ["products"],
  seller: ["orders"],
  driver: ["deliveries"],
  customer: [],
};
const STAFF_ROLES = ["admin", "product_manager", "seller", "driver"];
// Roles that can open the admin area (drivers only get "My deliveries")
const ADMIN_AREA_ROLES = ["admin", "product_manager", "seller"];

function isOwnerEmail(email) {
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

/** { role, country } — country limits a staff member to one country's orders (null = all) */
async function getStaff(user) {
  if (!user) return { role: "customer", country: null };
  if (isOwnerEmail(user.email)) return { role: "admin", country: null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const role = ROLE_PERMISSIONS[data?.role] ? data.role : "customer";
  return { role, country: role !== "customer" && data?.staff_country ? normalizeCountry(data.staff_country) : null };
}

async function getRole(user) {
  return (await getStaff(user)).role;
}

/** requirePermission("products") — also sets req.role / req.permissions */
function requirePermission(...needed) {
  return async (req, res, next) => {
    try {
      const { role, country } = await getStaff(req.user);
      const permissions = ROLE_PERMISSIONS[role] || [];
      req.role = role;
      req.permissions = permissions;
      req.staffCountry = country;
      const ok = needed.length === 0
        ? ADMIN_AREA_ROLES.includes(role)
        : needed.some((p) => permissions.includes(p));
      if (!ok) return res.status(403).json({ error: "You don't have permission for this action" });
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Kept for older routes: full admin only
const requireAdmin = requirePermission("team");


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 TechZhop API Running",
  });
});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    server: "TechZhop API",
    stripe: !!STRIPE_SECRET_KEY,
    supabase: !!SUPABASE_URL,
    time: new Date().toISOString(),
  });
});


// ======================================================
// GET PRODUCTS
// ======================================================

app.get("/products", async (req, res) => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        "id,name,title,description,price,image,stock,slug,sku"
      )
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "PRODUCTS ERROR:",
        error
      );

      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data || []);

  } catch (err) {
    console.error(
      "PRODUCT SERVER ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// ======================================================
// GET SINGLE PRODUCT
// ======================================================

app.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        "id,name,title,description,price,image,stock,slug,sku"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(
        "SINGLE PRODUCT ERROR:",
        error
      );

      return res.status(404).json({
        error: error.message,
      });
    }

    res.json(data);

  } catch (err) {
    console.error(
      "PRODUCT SERVER ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// ======================================================
// ADD PRODUCT
// ======================================================

app.post("/products", requireAuth, requirePermission("products"), async (req, res) => {
  try {
    const {
      name,
      title,
      description,
      price,
      image,
      stock,
      slug,
      sku,
    } = req.body;

    const productName =
      name || title;

    if (!productName) {
      return res.status(400).json({
        error: "Product name is required",
      });
    }

    if (
      price === undefined ||
      price === null
    ) {
      return res.status(400).json({
        error: "Product price is required",
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .insert({
        name: productName,
        title:
          title || productName,
        description:
          description || "",
        price: Number(price),
        image: image || null,
        stock: Number(stock || 0),
        slug: slug || null,
        sku: sku || null,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "ADD PRODUCT ERROR:",
        error
      );

      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    console.error(
      "ADD PRODUCT SERVER ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});


// ======================================================
// CREATE STRIPE CHECKOUT SESSION
// ======================================================

app.post("/create-checkout-session", rateLimit("checkout", 30, 10 * 60 * 1000), requireAuth, async (req, res) => {
  try {
    const { items, shipping_address, return_to, address_id } = req.body || {};
    let address = req.body?.address || null;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // The saved address (if given) is the source of truth for country/state/city
    let savedAddress = null;
    if (address_id) {
      const { data } = await supabase.from("addresses").select("*").eq("id", address_id).eq("user_id", req.user.id).maybeSingle();
      savedAddress = data || null;
      if (savedAddress) address = savedAddress;
    }

    const settings0 = await getShopSettings();
    const country = normalizeCountry(address?.country || "US");
    const cfg = countryCfg(settings0, country);
    if (!cfg) return res.status(400).json({ error: `We don't deliver to ${country} yet.` });
    if (!(cfg.payments || []).includes("card")) {
      return res.status(400).json({ error: "Card payment isn't available for this country. Choose pay on delivery." });
    }

    const ids = [...new Set(items.map((i) => Number(i.product_id)).filter(Number.isInteger))];
    const { data: products, error } = await supabase.from("products").select("*").in("id", ids);
    if (error) return res.status(500).json({ error: error.message });

    let subtotal = 0;
    const line_items = items.map((item) => {
      const product = (products || []).find((p) => Number(p.id) === Number(item.product_id));
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.status && product.status !== "active") throw new Error(`${product.name} is no longer available`);

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Invalid quantity for ${product.name}`);
      const available = stockFor(product, country, settings0);
      if (available != null && quantity > available) {
        throw new Error(available > 0 ? `Only ${available} left in stock for ${product.name}` : `${product.name} is out of stock in your country`);
      }

      const unit = effectivePrice(product); // sale price when active
      if (!(unit > 0)) throw new Error(`Invalid price for ${product.name}`);
      subtotal += unit * quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            ...(product.image ? { images: [product.image] } : {}),
            metadata: { product_id: String(product.id) },
          },
          unit_amount: Math.round(unit * 100),
        },
        quantity,
      };
    });

    const settings = await getShopSettings();
    const shipping = shippingCost(settings, address?.country, subtotal);
    const rate = taxRate(settings, address?.country, address?.state);
    const tax = Math.round(subtotal * rate) / 100;

    if (tax > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Sales tax (${rate}%)`,
            metadata: { kind: "tax" },
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const ship = { ...DEFAULT_SHOP_SETTINGS.shipping, ...(settings.shipping || {}) };
    if (Number(cfg.max_days) > 0) {
      ship.min_days = Number(cfg.min_days) || 1;
      ship.max_days = Number(cfg.max_days);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      customer_email: req.user.email || undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: Math.round(shipping * 100), currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: Number(ship.min_days) || 3 },
              maximum: { unit: "business_day", value: Number(ship.max_days) || 7 },
            },
          },
        },
      ],
      metadata: {
        user_id: String(req.user.id),
        shipping_address: String(shipping_address || "").slice(0, 490),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        country,
        state: String(address?.state || "").slice(0, 60),
        city: String(address?.city || "").slice(0, 80),
        postal_code: String(address?.postal_code || "").slice(0, 20),
        address_id: savedAddress ? String(savedAddress.id) : "",
      },
      success_url:
        return_to === "app"
          ? `${req.protocol}://${req.get("host")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
          : `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: return_to === "app" ? `${req.protocol}://${req.get("host")}/checkout/return` : `${SITE_URL}/cart`,
    });

    console.log("🛒 CHECKOUT:", session.id, "subtotal", subtotal, "shipping", shipping, "tax", tax);
    res.json({ success: true, id: session.id, url: session.url });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});


// ======================================================
// GET STRIPE CHECKOUT SESSION
//
// Used by Success.jsx
// ======================================================

app.get(
  "/checkout-session/:sessionId",
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error:
            "Session ID is required",
        });
      }

      const { session, orderId } =
        await fulfillCheckoutSession(sessionId);

      res.json({
        order_id: orderId,
        id: session.id,

        status:
          session.status,

        payment_status:
          session.payment_status,

        amount_total:
          session.amount_total,

        currency:
          session.currency,

        customer_email:
          session.customer_details
            ?.email || null,

        user_id:
          session.metadata
            ?.user_id || null,

        created:
          session.created,

        payment_intent:
          session.payment_intent ||
          null,
      });

    } catch (err) {
      console.error(
        "GET CHECKOUT SESSION ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// ======================================================
// GET ORDERS FOR USER
// ======================================================

app.get(
  "/orders/:userId",
  requireAuth,
  async (req, res) => {
    try {
      const {
        userId,
      } = req.params;

      if (userId !== req.user.id) {
        return res.status(403).json({
          error: "You can only view your own orders",
        });
      }

      if (!userId) {
        return res.status(400).json({
          error:
            "User ID is required",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select(
          `
            *,
            order_items (
              id,
              order_id,
              product_id,
              product_name,
              price,
              quantity,
              created_at
            )
          `
        )
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "GET ORDERS ERROR:",
          error
        );

        return res.status(500).json({
          error:
            error.message,
        });
      }

      res.json({
        success: true,
        orders: (data || []).map(
          ({ admin_note, ...o }) => o
        ),
      });

    } catch (err) {
      console.error(
        "ORDERS SERVER ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);


// ======================================================
// GET SINGLE ORDER
// ======================================================

app.get(
  "/order/:orderId",
  requireAuth,
  async (req, res) => {
    try {
      const orderId =
        Number(
          req.params.orderId
        );

      if (
        !Number.isInteger(
          orderId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid order ID",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select(
          `
            *,
            order_items (
              id,
              order_id,
              product_id,
              product_name,
              price,
              quantity,
              created_at
            )
          `
        )
        .eq(
          "id",
          orderId
        )
        .single();

      if (error) {
        console.error(
          "GET ORDER ERROR:",
          error
        );

        return res.status(404).json({
          error:
            error.message,
        });
      }

      if (data.user_id !== req.user.id) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      const view = publicOrderView(data);
      if (data.driver_id && ["picked_up", "out_for_delivery", "delivered"].includes(data.delivery_status)) {
        const { data: d } = await supabase.from("profiles").select("full_name, phone").eq("id", data.driver_id).maybeSingle();
        view.driver = { name: d?.full_name || null, phone: data.delivery_status === "out_for_delivery" ? d?.phone || null : null };
      }
      res.json({
        success: true,
        order: view,
      });

    } catch (err) {
      console.error(
        "SINGLE ORDER ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);





// ======================================================
// PAY ON DELIVERY (cash / Mobile Money to the driver)
// POST /orders/cod { items: [{ product_id, quantity }], address_id }
// ======================================================

app.post("/orders/cod", rateLimit("cod", 20, 10 * 60 * 1000), requireAuth, async (req, res) => {
  try {
    const cols = await orderColumns();
    if (!cols.includes("payment_method")) {
      return res.status(400).json({ error: "Pay on delivery is not enabled yet: run supabase/migrations/20260930_countries.sql in Supabase." });
    }
    const { items, address_id } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const { data: address } = await supabase.from("addresses").select("*").eq("id", address_id).eq("user_id", req.user.id).maybeSingle();
    if (!address) return res.status(400).json({ error: "Please choose a delivery address" });
    if (!address.phone) return res.status(400).json({ error: "Please add a phone number to your address so the driver can call you" });

    const settings = await getShopSettings();
    const country = normalizeCountry(address.country);
    const cfg = countryCfg(settings, country);
    if (!cfg) return res.status(400).json({ error: `We don't deliver to ${country} yet.` });
    if (!(cfg.payments || []).includes("cod")) return res.status(400).json({ error: "Pay on delivery isn't available for this country." });

    const ids = [...new Set(items.map((i) => Number(i.product_id)).filter(Number.isInteger))];
    const { data: products, error: pErr } = await supabase.from("products").select("*").in("id", ids);
    if (pErr) return res.status(500).json({ error: pErr.message });

    let subtotal = 0;
    const lines = items.map((item) => {
      const product = (products || []).find((p) => Number(p.id) === Number(item.product_id));
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.status && product.status !== "active") throw new Error(`${product.name} is no longer available`);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Invalid quantity for ${product.name}`);
      const available = stockFor(product, country, settings);
      if (available != null && quantity > available) {
        throw new Error(available > 0 ? `Only ${available} left in stock for ${product.name}` : `${product.name} is out of stock in your country`);
      }
      const unit = effectivePrice(product);
      subtotal += unit * quantity;
      return { product, quantity, unit };
    });

    subtotal = round2(subtotal);
    const shipping = shippingCost(settings, country, subtotal);
    const rate = taxRate(settings, country, address.state);
    const tax = Math.round(subtotal * rate) / 100;
    const total = round2(subtotal + shipping + tax);
    const local = isLocalDelivery(settings, address);
    const now = new Date().toISOString();

    const shippingText = [
      address.full_name, address.line1, address.line2, address.neighborhood,
      [address.postal_code, address.city].filter(Boolean).join(" "), address.state, address.country,
      address.landmark ? `(${address.landmark})` : null, address.phone,
    ].filter(Boolean).join(", ");

    const row = {
      user_id: req.user.id,
      total,
      shipping_address: shippingText,
      status: "processing",
      created_at: now,
      updated_at: now,
      ...pickCols(cols, {
        subtotal, shipping_amount: shipping, tax_amount: tax, discount_amount: 0,
        country, payment_method: "cod", payment_status: "unpaid",
        currency: cfg.currency || "USD", local_total: localAmount(cfg, total),
        delivery_mode: local ? "local" : "carrier",
        delivery_code: newDeliveryCode(),
        customer_phone: address.phone,
        delivery_lat: address.latitude ?? null,
        delivery_lng: address.longitude ?? null,
      }),
    };

    const { data: order, error } = await supabase.from("orders").insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });

    const orderItems = lines.map((l) => ({
      order_id: order.id, product_id: l.product.id, product_name: l.product.name, price: l.unit, quantity: l.quantity, created_at: now,
    }));
    const { error: iErr } = await supabase.from("order_items").insert(orderItems);
    if (iErr) console.error("ORDER ITEMS ERROR:", iErr.message);

    await adjustStock(orderItems, country, -1, settings);
    await supabase.from("cart_items").delete().eq("user_id", req.user.id);

    console.log("🧾 COD ORDER:", order.id, country, total, "USD /", row.local_total, row.currency);
    await sendOrderPush(req.user.id, order.id, "processing");
    const info = await userInfo(req.user.id).catch(() => null);
    emails.orderConfirmationEmail({ to: info?.email || req.user.email, name: info?.name, language: info?.language, order, items: orderItems });
    if (ADMIN_EMAILS.length) emails.newOrderAdminEmail({ to: ADMIN_EMAILS, order, items: orderItems });

    res.json({ success: true, order_id: order.id, order: publicOrderView(order) });
  } catch (err) {
    console.error("COD ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});


// ======================================================
// DRIVERS
// Staff with the "driver" role see only the orders assigned to them.
// ======================================================

app.get("/admin/drivers", requireAuth, requirePermission("orders"), async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "driver");
  if (error) return res.status(500).json({ error: error.message });
  const drivers = (data || [])
    .filter((d) => !req.staffCountry || !d.staff_country || normalizeCountry(d.staff_country) === req.staffCountry)
    .map((d) => ({ id: d.id, name: d.full_name || null, phone: d.phone || null, country: d.staff_country || null }));
  res.json({ drivers });
});

// What a driver may see about a delivery (no delivery code: the customer gives it at the door)
function driverView(o) {
  return {
    id: o.id, status: o.status, created_at: o.created_at, country: o.country,
    shipping_address: o.shipping_address, customer_phone: o.customer_phone,
    delivery_lat: o.delivery_lat, delivery_lng: o.delivery_lng,
    delivery_status: o.delivery_status, delivery_note: o.delivery_note,
    payment_method: o.payment_method, payment_status: o.payment_status,
    currency: o.currency, local_total: o.local_total, total: o.total,
    needs_code: !!o.delivery_code,
    picked_up_at: o.picked_up_at, out_for_delivery_at: o.out_for_delivery_at, delivered_at: o.delivered_at,
    order_items: (o.order_items || []).map((i) => ({ id: i.id, product_name: i.product_name, quantity: i.quantity })),
  };
}

app.get("/driver/deliveries", requireAuth, requirePermission("deliveries"), async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items (id, product_name, quantity)")
    .eq("driver_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deliveries: (data || []).map(driverView) });
});

let deliveriesBucketReady = false;

app.post("/driver/deliveries/:orderId", rateLimit("driver", 120, 10 * 60 * 1000), requireAuth, requirePermission("deliveries"), async (req, res) => {
  const orderId = Number(req.params.orderId);
  const action = req.body?.action;
  const { data: order } = await supabase.from("orders").select("*, order_items (id, product_name, quantity)").eq("id", orderId).maybeSingle();
  if (!order || order.driver_id !== req.user.id) return res.status(404).json({ error: "Delivery not found" });
  if (order.status === "cancelled") return res.status(400).json({ error: "This order was cancelled" });

  const now = new Date().toISOString();
  const update = { updated_at: now };
  let customerStatus = null;

  if (action === "picked_up") {
    update.delivery_status = "picked_up";
    update.picked_up_at = now;
  } else if (action === "out_for_delivery") {
    update.delivery_status = "out_for_delivery";
    update.out_for_delivery_at = now;
    update.status = "shipped";
  } else if (action === "failed") {
    update.delivery_status = "failed";
    update.delivery_note = String(req.body?.note || "").slice(0, 500) || null;
  } else if (action === "delivered") {
    if (order.delivery_code && String(req.body?.code || "").trim() !== String(order.delivery_code)) {
      return res.status(400).json({ error: "Wrong delivery code. Ask the customer for the 4-digit code shown in their app or email." });
    }
    if (order.payment_method === "cod" && order.payment_status !== "collected" && !req.body?.collected) {
      return res.status(400).json({ error: "Confirm that you collected the payment first." });
    }
    update.delivery_status = "delivered";
    update.status = "delivered";
    update.delivered_at = now;
    if (order.payment_method === "cod" && req.body?.collected) {
      update.payment_status = "collected";
      update.collected_at = now;
      update.collected_method = ["cash", "mobile_money"].includes(req.body?.collected_method) ? req.body.collected_method : "cash";
    }
    if (req.body?.note) update.delivery_note = String(req.body.note).slice(0, 500);

    // Optional photo of the delivered package
    if (req.body?.photo) {
      try {
        if (!deliveriesBucketReady) {
          const { data: bucket } = await supabase.storage.getBucket("deliveries");
          if (!bucket) await supabase.storage.createBucket("deliveries", { public: false });
          deliveriesBucketReady = true;
        }
        const path = `${order.id}/${Date.now()}.jpg`;
        const buffer = Buffer.from(String(req.body.photo).replace(/^data:[^,]+,/, ""), "base64");
        const { error: upErr } = await supabase.storage.from("deliveries").upload(path, buffer, { contentType: "image/jpeg" });
        if (!upErr) update.delivery_photo = path;
        else console.error("DELIVERY PHOTO:", upErr.message);
      } catch (err) {
        console.error("DELIVERY PHOTO:", err.message);
      }
    }
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }

  const cols = await orderColumns();
  const safe = {};
  for (const [k, v] of Object.entries(update)) if (["updated_at", "status"].includes(k) || cols.includes(k)) safe[k] = v;

  const { data, error } = await supabase.from("orders").update(safe).eq("id", orderId).select("*, order_items (id, product_name, quantity)").single();
  if (error) return res.status(500).json({ error: error.message });

  // Tell the customer
  const info = await userInfo(order.user_id).catch(() => null);
  if (action === "out_for_delivery") {
    const { data: me } = await supabase.from("profiles").select("full_name, phone").eq("id", req.user.id).maybeSingle();
    const driverName = me?.full_name || "TechZhop";
    sendPushTo(order.user_id, COURIER_PUSH, "onTheWay", { id: order.id, name: driverName, code: order.delivery_code || "" }, { orderId: order.id });
    emails.outForDeliveryEmail({ to: info?.email, name: info?.name, language: info?.language, order: data, driverName, driverPhone: me?.phone });
  } else if (action === "delivered") {
    await sendOrderPush(order.user_id, order.id, "delivered");
    if (info?.notifyOrders) emails.orderUpdateEmail({ to: info.email, name: info.name, language: info.language, order: data });
  } else if (action === "failed" && ADMIN_EMAILS.length) {
    console.log("⚠️ DELIVERY FAILED:", order.id, update.delivery_note);
  }

  res.json({ success: true, delivery: driverView(data) });
});


// ======================================================
// FINANCES (admins with "revenue")
// Stripe balance + payouts to the bank (bank details stay at Stripe),
// sales summary, and cash collected by drivers (pay on delivery).
// ======================================================

app.get("/admin/finances", requireAuth, requirePermission("revenue"), async (req, res) => {
  const live = STRIPE_SECRET_KEY.startsWith("sk_live");
  const dash = `https://dashboard.stripe.com/${live ? "" : "test/"}`;
  const out = { stripe: null, sales: null, drivers: [], remit_enabled: false };

  // --- Stripe: balance, payout schedule, last payouts ---
  try {
    const [balance, payouts, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 10, expand: ["data.destination"] }),
      stripe.accounts.retrieve().catch(() => null),
    ]);
    const money = (list) => (list || []).map((b) => ({ amount: b.amount / 100, currency: b.currency.toUpperCase() }));
    out.stripe = {
      mode: live ? "live" : "test",
      available: money(balance.available),
      pending: money(balance.pending),
      payouts_enabled: account ? !!account.payouts_enabled : null,
      schedule: account?.settings?.payouts?.schedule?.interval || null,
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency.toUpperCase(),
        status: p.status,
        arrival_date: new Date(p.arrival_date * 1000).toISOString(),
        bank: p.destination && typeof p.destination === "object"
          ? { name: p.destination.bank_name || p.destination.brand || null, last4: p.destination.last4 || null }
          : null,
      })),
      links: { payouts: `${dash}settings/payouts`, balance: `${dash}balance/overview`, payments: `${dash}payments` },
    };
  } catch (err) {
    out.stripe = { error: err.message, links: { payouts: `${dash}settings/payouts`, balance: `${dash}balance/overview`, payments: `${dash}payments` } };
  }

  // --- Sales over the last 30 days ---
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", since)
    .neq("status", "cancelled")
    .limit(5000);
  const sales = { days: 30, count: 0, total_usd: 0, refunded_usd: 0, byCountry: {}, cod_pending: {} };
  for (const o of orders || []) {
    sales.count++;
    sales.total_usd += Number(o.total || 0);
    sales.refunded_usd += Number(o.refunded_amount || 0);
    const c = normalizeCountry(o.country || "US");
    sales.byCountry[c] = sales.byCountry[c] || { count: 0, total_usd: 0 };
    sales.byCountry[c].count++;
    sales.byCountry[c].total_usd += Number(o.total || 0);
    if (o.payment_method === "cod" && o.payment_status === "unpaid") {
      const cur = o.currency || "USD";
      sales.cod_pending[cur] = (sales.cod_pending[cur] || 0) + Number(o.local_total ?? o.total ?? 0);
    }
  }
  sales.total_usd = round2(sales.total_usd);
  sales.refunded_usd = round2(sales.refunded_usd);
  out.sales = sales;

  // --- Cash collected by drivers, not yet handed over ---
  const cols = await orderColumns();
  out.remit_enabled = cols.includes("cash_remitted_at");
  if (cols.includes("driver_id")) {
    const { data: cod } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_method", "cod")
      .eq("payment_status", "collected")
      .not("driver_id", "is", null)
      .order("collected_at", { ascending: false })
      .limit(5000);
    const map = {};
    for (const o of cod || []) {
      if (out.remit_enabled && o.cash_remitted_at) continue;
      const key = `${o.driver_id}|${o.currency || "USD"}`;
      map[key] = map[key] || { driver_id: o.driver_id, currency: o.currency || "USD", count: 0, amount: 0, cash: 0, mobile_money: 0 };
      const amt = Number(o.local_total ?? o.total ?? 0);
      map[key].count++;
      map[key].amount += amt;
      if (o.collected_method === "mobile_money") map[key].mobile_money += amt;
      else map[key].cash += amt;
    }
    const ids = [...new Set(Object.values(map).map((m) => m.driver_id))];
    const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids) : { data: [] };
    out.drivers = Object.values(map).map((m) => {
      const p = (people || []).find((x) => x.id === m.driver_id);
      return { ...m, name: p?.full_name || null, phone: p?.phone || null };
    }).sort((a, b) => b.amount - a.amount);
  }

  res.json(out);
});

// The driver handed over the cash: mark those orders as settled
app.post("/admin/finances/remit", requireAuth, requirePermission("revenue"), async (req, res) => {
  const cols = await orderColumns();
  if (!cols.includes("cash_remitted_at")) {
    return res.status(400).json({ error: "Run supabase/migrations/20260930b_finances.sql in Supabase first." });
  }
  const { driver_id, currency } = req.body || {};
  if (!driver_id) return res.status(400).json({ error: "driver_id is required" });
  let q = supabase
    .from("orders")
    .update({ cash_remitted_at: new Date().toISOString() })
    .eq("driver_id", driver_id)
    .eq("payment_method", "cod")
    .eq("payment_status", "collected")
    .is("cash_remitted_at", null);
  if (currency) q = q.eq("currency", currency);
  const { data, error } = await q.select("id");
  if (error) return res.status(500).json({ error: error.message });
  console.log("💵 CASH REMITTED:", driver_id, currency, (data || []).length, "orders by", req.user.email);
  res.json({ success: true, count: (data || []).length });
});

// ======================================================
// CANCELLATIONS, RETURNS AND REFUNDS
// Customer: POST /orders/:id/request { type: "cancel" | "return", reason }
// Staff:    POST /admin/orders/:id/decision { decision: "approved" | "rejected", message }
// Admin:    POST /admin/orders/:id/refund { amount, restock, cancel }
// ======================================================

const RETURN_DAYS = Number(process.env.RETURN_DAYS || 14);
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function requestOptions(order) {
  const open = !order.request_status || order.request_status === "rejected";
  const deliveredAt = order.delivered_at || (order.status === "delivered" ? order.updated_at : null);
  const deadline = deliveredAt ? new Date(new Date(deliveredAt).getTime() + RETURN_DAYS * 86400000) : null;
  const refundedAll = Number(order.refunded_amount || 0) >= Number(order.total || 0) - 0.001;
  return {
    can_cancel: ["paid", "processing"].includes(order.status) && !order.request_status && !refundedAll,
    can_return: order.status === "delivered" && !!deadline && deadline > new Date() && open && order.request_type !== "return" && !refundedAll,
    return_deadline: deadline ? deadline.toISOString() : null,
    return_days: RETURN_DAYS,
  };
}

function publicOrderView(order) {
  const { admin_note, driver_id, delivery_photo, ...rest } = order;
  return { ...rest, ...requestOptions(order) };
}

async function needReturnColumns(res) {
  const cols = await orderColumns();
  if (!cols.includes("request_type") || !cols.includes("refunded_amount")) {
    res.status(400).json({ error: "Returns are not enabled yet: run the SQL file supabase/migrations/20260929e_returns.sql in Supabase." });
    return false;
  }
  return true;
}

app.post("/orders/:orderId/request", rateLimit("request", 10, 60 * 60 * 1000), requireAuth, async (req, res) => {
  if (!(await needReturnColumns(res))) return;
  const orderId = Number(req.params.orderId);
  const type = req.body?.type;
  const reason = String(req.body?.reason || "").trim().slice(0, 1000);

  if (!["cancel", "return"].includes(type)) return res.status(400).json({ error: "Invalid request type" });
  if (!reason) return res.status(400).json({ error: "Please tell us why" });

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== req.user.id) return res.status(404).json({ error: "Order not found" });

  const opts = requestOptions(order);
  if ((type === "cancel" && !opts.can_cancel) || (type === "return" && !opts.can_return)) {
    return res.status(400).json({ error: "This request is no longer possible for this order." });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ request_type: type, request_status: "pending", request_reason: reason, requested_at: now, updated_at: now })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const info = await userInfo(order.user_id).catch(() => null);
  emails.requestReceivedEmail({ to: info?.email, name: info?.name, language: info?.language, order: data });
  if (ADMIN_EMAILS.length) emails.requestAdminEmail({ to: ADMIN_EMAILS, order: data, customer: info });

  res.json({ success: true, order: publicOrderView(data) });
});

app.post("/admin/orders/:orderId/decision", requireAuth, requirePermission("orders"), async (req, res) => {
  if (!(await needReturnColumns(res))) return;
  const orderId = Number(req.params.orderId);
  const decision = req.body?.decision;
  const message = String(req.body?.message || "").trim().slice(0, 2000);
  if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ error: "Invalid decision" });

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!order.request_type) return res.status(400).json({ error: "No request on this order" });

  const cols = await orderColumns();
  const update = { request_status: decision, updated_at: new Date().toISOString() };
  if (cols.includes("request_message")) update.request_message = message || null;

  const { data, error } = await supabase.from("orders").update(update).eq("id", orderId).select("*").single();
  if (error) return res.status(500).json({ error: error.message });

  const info = await userInfo(order.user_id).catch(() => null);
  emails.requestDecisionEmail({ to: info?.email, name: info?.name, language: info?.language, order: data, message });

  res.json({ success: true, order: data });
});

app.post("/admin/orders/:orderId/refund", rateLimit("refund", 30, 60 * 60 * 1000), requireAuth, requirePermission("revenue"), async (req, res) => {
  if (!(await needReturnColumns(res))) return;
  const orderId = Number(req.params.orderId);

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items (product_id, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return res.status(404).json({ error: "Order not found" });

  const refundable = round2(Number(order.total) - Number(order.refunded_amount || 0));
  const amount = round2(req.body?.amount === undefined || req.body?.amount === "" ? refundable : req.body.amount);
  if (!(amount > 0) || amount > refundable + 0.001) {
    return res.status(400).json({ error: `Amount must be between 0.01 and ${refundable}` });
  }
  if (!order.stripe_session_id) return res.status(400).json({ error: "No Stripe payment on this order" });

  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (!session.payment_intent) return res.status(400).json({ error: "No Stripe payment on this order" });
    await stripe.refunds.create({
      payment_intent: session.payment_intent,
      amount: Math.round(amount * 100),
      metadata: { order_id: String(order.id), by: req.user.email || req.user.id },
    });
  } catch (err) {
    console.error("REFUND ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }

  const now = new Date().toISOString();
  const update = { refunded_amount: round2(Number(order.refunded_amount || 0) + amount), refunded_at: now, updated_at: now };
  if (order.request_status === "pending") update.request_status = "approved";
  const cancel = req.body?.cancel ?? (order.request_type === "cancel");
  if (cancel && order.status !== "delivered") update.status = "cancelled";

  // Put the products back in stock
  if (req.body?.restock) {
    await adjustStock(order.order_items, order.country || "US", +1);
  }

  const { data, error } = await supabase.from("orders").update(update).eq("id", orderId).select("*").single();
  if (error) return res.status(500).json({ error: error.message });

  console.log("💸 REFUND:", order.id, amount);
  if (update.status) await sendOrderPush(order.user_id, order.id, update.status);
  const info = await userInfo(order.user_id).catch(() => null);
  emails.refundEmail({ to: info?.email, name: info?.name, language: info?.language, order: data, amount });

  res.json({ success: true, order: data, refunded: amount });
});


// ======================================================
// SITEMAP (for Google) — list of public pages and products
// ======================================================

app.get("/sitemap.xml", async (req, res) => {
  const { data } = await supabase.from("products").select("*").limit(5000);
  const products = (data || []).filter((p) => !p.status || ["active", "published"].includes(p.status));
  const esc = (u) => u.replace(/&/g, "&amp;");
  const urls = [
    "/", "/products", "/help", "/terms", "/privacy",
    ...products.map((p) => `/product/${p.id}`),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(SITE_URL + u)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  res.set("Content-Type", "application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
});

// ======================================================
// DELETE MY ACCOUNT
// Removes the user's personal data and login.
// Orders are kept (accounting) but detached from the user.
// ======================================================

app.delete("/account", rateLimit("account", 5, 60 * 60 * 1000), requireAuth, async (req, res) => {
  const userId = req.user.id;
  const info = await userInfo(userId).catch(() => null);

  try {
    await supabase.from("cart_items").delete().eq("user_id", userId);
    await supabase.from("addresses").delete().eq("user_id", userId);
    await supabase.from("push_tokens").delete().eq("user_id", userId);

    const { error: ordersError } = await supabase
      .from("orders")
      .update({ user_id: null })
      .eq("user_id", userId);

    if (ordersError) {
      console.error("DETACH ORDERS ERROR:", ordersError.message);
    }

    // Avatar files
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (files?.length) {
      await supabase.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    await supabase.from("profiles").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("DELETE USER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("🗑️ ACCOUNT DELETED:", userId);
    if (info) emails.accountDeletedEmail(info && { to: info.email, name: info.name, language: info.language });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ======================================================
// ADMIN — LIST ALL ORDERS
// ======================================================

app.get("/admin/orders", requireAuth, requirePermission("orders"), async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items (id, product_id, product_name, price, quantity)"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const list = req.staffCountry ? (data || []).filter((o) => normalizeCountry(o.country || "US") === req.staffCountry) : data || [];
  res.json({ success: true, orders: list });
});



// Which columns exist in "orders" (detected, refreshed every minute)
let orderColumnsCache = null;
let orderColumnsAt = 0;

async function orderColumns() {
  if (orderColumnsCache && Date.now() - orderColumnsAt < 60000) return orderColumnsCache;
  const { data } = await supabase.from("orders").select("*").limit(1);
  let cols = data?.[0] ? Object.keys(data[0]) : null;
  if (!cols) {
    // No order yet: ask for each optional column (an unknown column returns an error)
    cols = ["id", "user_id", "total", "status", "stripe_session_id", "created_at", "updated_at"];
    const checks = await Promise.all(
      OPTIONAL_ORDER_COLUMNS.map((c) => supabase.from("orders").select(c).limit(1).then(({ error }) => (error ? null : c)))
    );
    cols.push(...checks.filter(Boolean));
  }
  orderColumnsCache = cols;
  orderColumnsAt = Date.now();
  return cols;
}

/** Keep only the fields whose column exists in "orders" */
function pickCols(cols, obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (cols.includes(k)) out[k] = v;
  return out;
}

const OPTIONAL_ORDER_COLUMNS = [
  "shipping_address", "tracking_number", "carrier", "admin_note", "subtotal", "shipping_amount", "tax_amount",
  "discount_amount", "request_type", "request_status", "request_reason", "request_message", "requested_at",
  "refunded_amount", "refunded_at", "delivered_at",
  "country", "payment_method", "payment_status", "currency", "local_total", "delivery_mode", "driver_id",
  "delivery_status", "delivery_code", "delivery_photo", "delivery_note", "picked_up_at", "out_for_delivery_at",
  "collected_at", "collected_method", "customer_phone", "delivery_lat", "delivery_lng", "cash_remitted_at",
];

// ADMIN — ONE ORDER WITH CUSTOMER, PRODUCTS AND PAYMENT DETAILS
app.get("/admin/orders/:orderId", requireAuth, requirePermission("orders"), async (req, res) => {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items (id, product_id, product_name, price, quantity)")
    .eq("id", req.params.orderId)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  if (req.staffCountry && normalizeCountry(order.country || "US") !== req.staffCountry) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Driver + delivery photo (private bucket → temporary link)
  if (order.driver_id) {
    const { data: d } = await supabase.from("profiles").select("full_name, phone").eq("id", order.driver_id).maybeSingle();
    order.driver = { id: order.driver_id, name: d?.full_name || null, phone: d?.phone || null };
  }
  if (order.delivery_photo) {
    const { data: signed } = await supabase.storage.from("deliveries").createSignedUrl(order.delivery_photo, 3600);
    order.delivery_photo_url = signed?.signedUrl || null;
  }

  // Product photos
  const ids = (order.order_items || []).map((i) => i.product_id).filter(Boolean);
  if (ids.length) {
    const { data: products } = await supabase.from("products").select("id, image").in("id", ids);
    const images = Object.fromEntries((products || []).map((p) => [p.id, p.image]));
    order.order_items = order.order_items.map((i) => ({ ...i, image: images[i.product_id] || null }));
  }

  // Customer
  let customer = null;
  if (order.user_id) {
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", order.user_id).maybeSingle(),
      supabase.auth.admin.getUserById(order.user_id),
    ]);
    customer = {
      name: profile?.full_name || authUser?.user?.user_metadata?.full_name || null,
      email: authUser?.user?.email || null,
      phone: profile?.phone || null,
      avatar_url: profile?.avatar_url || null,
    };
  }

  // Payment (Stripe)
  let payment = null;
  if (order.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      const live = STRIPE_SECRET_KEY.startsWith("sk_live");
      payment = {
        email: session.customer_details?.email || null,
        name: session.customer_details?.name || null,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency,
        status: session.payment_status,
        payment_intent: session.payment_intent,
        dashboard_url: session.payment_intent
          ? `https://dashboard.stripe.com/${live ? "" : "test/"}payments/${session.payment_intent}`
          : null,
      };
      if (!customer) customer = { name: payment.name, email: payment.email, phone: null };
    } catch (err) {
      console.error("STRIPE SESSION ERROR:", err.message);
    }
  }

  const cols = await orderColumns();
  res.json({
    order,
    customer,
    payment,
    fields: { carrier: cols.includes("carrier"), note: cols.includes("admin_note"), returns: cols.includes("refunded_amount") && cols.includes("request_type"), delivery: cols.includes("driver_id") && cols.includes("delivery_status") },
  });
});


// ======================================================
// ADMIN — UPDATE ORDER STATUS / TRACKING NUMBER
// ======================================================

app.patch("/admin/orders/:orderId", requireAuth, requirePermission("orders"), async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { status, tracking_number } = req.body || {};

  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  if (status && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const update = { updated_at: new Date().toISOString() };
  if (status) update.status = status;
  if (tracking_number !== undefined) update.tracking_number = tracking_number || null;

  const orderCols = await orderColumns();
  if (status === "delivered" && orderCols.includes("delivered_at")) update.delivered_at = new Date().toISOString();
  for (const key of ["carrier", "admin_note"]) {
    if (req.body?.[key] !== undefined && orderCols.includes(key)) {
      update[key] = req.body[key] || null;
    }
  }

  const { data: current } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!current || (req.staffCountry && normalizeCountry(current.country || "US") !== req.staffCountry)) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Assign / unassign a driver
  let newDriver = null;
  if (req.body?.driver_id !== undefined && orderCols.includes("driver_id")) {
    const driverId = req.body.driver_id || null;
    if (driverId) {
      const { data: d } = await supabase.from("profiles").select("id, role, staff_country").eq("id", driverId).maybeSingle();
      if (!d || d.role !== "driver") return res.status(400).json({ error: "This person is not a driver" });
      newDriver = d;
    }
    update.driver_id = driverId;
    update.delivery_status = driverId ? "assigned" : null;
    if (driverId && !current.delivery_code) update.delivery_code = newDeliveryCode();
    if (driverId) update.delivery_mode = "local";
  }
  // Payment received in cash / Mobile Money (pay on delivery)
  if (req.body?.payment_status !== undefined && orderCols.includes("payment_status")) {
    if (!["unpaid", "collected", "paid"].includes(req.body.payment_status)) return res.status(400).json({ error: "Invalid payment status" });
    update.payment_status = req.body.payment_status;
    if (req.body.payment_status === "collected" && orderCols.includes("collected_at")) update.collected_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (newDriver && newDriver.id !== current.driver_id) {
    sendPushTo(newDriver.id, DRIVER_PUSH, "newDelivery", { id: data.id }, { deliveryId: data.id });
  }

  if (status) {
    await sendOrderPush(data.user_id, data.id, data.status);

    if (["processing", "shipped", "delivered", "cancelled"].includes(status)) {
      const info = await userInfo(data.user_id).catch(() => null);
      if (info?.notifyOrders) {
        emails.orderUpdateEmail({
          to: info.email,
          name: info.name,
          language: info.language,
          order: data,
          trackingUrl: trackingLink(data.carrier, data.tracking_number),
        });
      }
    }
  }

  res.json({ success: true, order: data });
});



// ======================================================
// ADMIN — PRODUCTS, PHOTOS, CATEGORIES, BRANDS, STATS
// ======================================================

// Which columns exist in the "products" table (detected once)
let productColumnsCache = null;
let productColumnsAt = 0;

async function productColumns() {
  if (productColumnsCache && Date.now() - productColumnsAt < 60000) return productColumnsCache;
  const { data } = await supabase.from("products").select("*").limit(1);
  const cols = data?.[0] ? Object.keys(data[0]) : [];
  if (cols.length) {
    productColumnsCache = cols;
    productColumnsAt = Date.now();
  }
  return cols.length
    ? cols
    : ["name", "title", "description", "price", "image", "stock", "slug", "sku", "status"];
}

const EDITABLE_PRODUCT_FIELDS = [
  "name", "title", "description", "price", "stock", "image", "images",
  "sku", "slug", "status", "category_id", "brand_id", "featured",
  "sale_price", "sale_ends_at", "stock_by_country",
];

async function cleanProduct(body) {
  const cols = await productColumns();
  const out = {};

  for (const key of EDITABLE_PRODUCT_FIELDS) {
    if (body[key] === undefined || !cols.includes(key)) continue;
    out[key] = body[key];
  }

  if (out.price !== undefined) out.price = Number(out.price);
  if (out.stock !== undefined) out.stock = Number(out.stock || 0);
  if (out.stock_by_country !== undefined) {
    const m = {};
    for (const [k, v] of Object.entries(out.stock_by_country || {})) {
      const c = normalizeCountry(k);
      if (/^[A-Z]{2}$/.test(c) && v !== "" && v != null) m[c] = Math.max(0, parseInt(v, 10) || 0);
    }
    out.stock_by_country = m;
  }
  if (out.category_id === "") out.category_id = null;
  if (out.brand_id === "") out.brand_id = null;
  if (out.sale_price !== undefined) out.sale_price = Number(out.sale_price) > 0 ? Number(out.sale_price) : null;
  if (out.sale_ends_at !== undefined) out.sale_ends_at = out.sale_ends_at ? new Date(out.sale_ends_at).toISOString() : null;

  if (Array.isArray(body.images) && body.images.length && cols.includes("image")) {
    out.image = body.images[0];
  }
  if (out.name && cols.includes("title") && out.title === undefined) {
    out.title = out.name;
  }
  if (cols.includes("updated_at")) out.updated_at = new Date().toISOString();
  return out;
}

// Is the logged-in user an admin? (used by the app to show the Admin menu)
app.get("/admin/me", requireAuth, async (req, res) => {
  const { role, country } = await getStaff(req.user);
  res.json({
    admin: ADMIN_AREA_ROLES.includes(role),
    driver: role === "driver",
    role,
    country,
    owner: isOwnerEmail(req.user.email),
    permissions: ROLE_PERMISSIONS[role] || [],
  });
});

// ------------------------------------------------------
// TEAM (admins only): list staff, give / remove a role
// ------------------------------------------------------

async function findUserByEmail(email) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

app.get("/admin/team", requireAuth, requirePermission("team"), async (req, res) => {
  const { data: staff, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", STAFF_ROLES);
  if (error) return res.status(500).json({ error: error.message });

  const members = await Promise.all(
    (staff || []).map(async (p) => {
      const { data } = await supabase.auth.admin.getUserById(p.id);
      const email = data?.user?.email || null;
      return { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, phone: p.phone, role: p.role, country: p.staff_country || null, email, owner: isOwnerEmail(email) };
    })
  );

  // Owners listed even if their profile role isn't set
  for (const email of ADMIN_EMAILS) {
    if (members.some((m) => (m.email || "").toLowerCase() === email)) continue;
    const user = await findUserByEmail(email).catch(() => null);
    members.unshift({ id: user?.id || email, email, full_name: user?.user_metadata?.full_name || null, role: "admin", owner: true });
  }

  res.json({ members });
});

app.post("/admin/team", rateLimit("team", 30, 60 * 60 * 1000), requireAuth, requirePermission("team"), async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const role = String(req.body?.role || "");
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!STAFF_ROLES.includes(role) && role !== "customer") {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (isOwnerEmail(email)) {
    return res.status(400).json({ error: "The shop owner is always admin" });
  }

  const language = String(req.body?.language || "en").slice(0, 5);
  let user = await findUserByEmail(email);
  let invited = false;

  if (!user) {
    if (role === "customer") return res.status(404).json({ error: "No account with this email." });
    // No account yet: Supabase sends an invitation email to create a password
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
      data: { language },
    });
    if (inviteError) return res.status(500).json({ error: inviteError.message });
    user = data.user;
    invited = true;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role }, { onConflict: "id" });
  if (error) return res.status(500).json({ error: error.message });

  // Optional: limit this person to one country (drivers, country managers)
  if (req.body?.country !== undefined) {
    const c = req.body.country ? normalizeCountry(req.body.country) : null;
    const { error: cErr } = await supabase.from("profiles").update({ staff_country: role === "customer" ? null : c }).eq("id", user.id);
    if (cErr) console.error("STAFF COUNTRY:", cErr.message);
  }

  if (STAFF_ROLES.includes(role)) {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    emails.staffEmail({
      to: email,
      name: p?.full_name || user.user_metadata?.full_name,
      language: user.user_metadata?.language || language,
      role,
      invited,
    });
  }

  console.log(`👥 ROLE: ${email} → ${role} (by ${req.user.email})${invited ? " [invited]" : ""}`);
  res.json({ success: true, invited, member: { id: user.id, email, role, country: req.body?.country || null } });
});

app.get("/admin/meta", requireAuth, requirePermission("products"), async (req, res) => {
  const cols = await productColumns();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  res.json({
    categories: categories || [],
    brands: brands || [],
    fields: {
      category: cols.includes("category_id"),
      brand: cols.includes("brand_id"),
      images: cols.includes("images"),
      status: cols.includes("status"),
      featured: cols.includes("featured"),
    },
  });
});

app.get("/admin/stats", requireAuth, requirePermission(), async (req, res) => {
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("total, status"),
    supabase.from("products").select("id, stock"),
  ]);
  const paidStatuses = ["paid", "processing", "shipped", "delivered"];
  const paid = (orders || []).filter((o) => paidStatuses.includes(o.status));
  res.json({
    revenue: req.permissions.includes("revenue")
      ? paid.reduce((t, o) => t + Number(o.total || 0), 0)
      : null,
    orders: (orders || []).length,
    toShip: (orders || []).filter((o) => ["paid", "processing"].includes(o.status)).length,
    products: (products || []).length,
    lowStock: (products || []).filter((p) => Number(p.stock || 0) <= 3).length,
  });
});

app.get("/admin/products", requireAuth, requirePermission("products"), async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*, brands(id, name), categories(id, name)")
    .order("id", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data || [] });
});

app.get("/admin/products/:id", requireAuth, requirePermission("products"), async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json({ product: data });
});

app.post("/admin/products", requireAuth, requirePermission("products"), async (req, res) => {
  const product = await cleanProduct(req.body || {});
  if (!product.name) return res.status(400).json({ error: "Product name is required" });
  if (!(product.price >= 0)) return res.status(400).json({ error: "Product price is required" });

  const cols = await productColumns();
  if (cols.includes("status") && !product.status) product.status = "active";

  const { data, error } = await supabase.from("products").insert(product).select().single();
  if (error) return res.status(500).json({ error: error.message });
  productColumnsCache = null;
  res.json({ product: data });
});

app.patch("/admin/products/:id", requireAuth, requirePermission("products"), async (req, res) => {
  const product = await cleanProduct(req.body || {});
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ product: data });
});

// Delete a product. If it appears in past orders it can't be deleted,
// so it is hidden from the store instead.
app.delete("/admin/products/:id", requireAuth, requirePermission("products"), async (req, res) => {
  const id = req.params.id;
  await supabase.from("cart_items").delete().eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (!error) return res.json({ deleted: true });

  const cols = await productColumns();
  if (cols.includes("status")) {
    const { error: hideError } = await supabase
      .from("products")
      .update({ status: "draft" })
      .eq("id", id);
    if (!hideError) return res.json({ deleted: false, hidden: true });
  }
  res.status(500).json({ error: error.message });
});

// Upload a product photo. Body: { data: "<base64>", contentType: "image/jpeg" }
let productsBucketReady = false;

app.post("/admin/upload", rateLimit("upload", 120, 10 * 60 * 1000), requireAuth, requirePermission("products", "store"), async (req, res) => {
  try {
    const { data: base64, contentType = "image/jpeg" } = req.body || {};
    if (!base64) return res.status(400).json({ error: "No image" });

    if (!productsBucketReady) {
      const { data: bucket } = await supabase.storage.getBucket("products");
      if (!bucket) await supabase.storage.createBucket("products", { public: true });
      productsBucketReady = true;
    }

    const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(base64.replace(/^data:[^,]+,/, ""), "base64");

    const { error } = await supabase.storage
      .from("products")
      .upload(path, buffer, { contentType, upsert: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick-create a category or brand from the product form
for (const table of ["categories", "brands"]) {
  app.post(`/admin/${table}`, requireAuth, requirePermission("products"), async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    const { data, error } = await supabase.from(table).insert({ name }).select("id, name").single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ item: data });
  });
}




// ======================================================
// STORE SETTINGS (shipping, taxes, delivery time)
// ======================================================

// Public: the website/app show shipping costs and delivery dates
app.get("/shop-settings", async (req, res) => {
  res.json(await getShopSettings());
});

app.get("/admin/settings", requireAuth, requirePermission("store"), async (req, res) => {
  res.json(await getShopSettings());
});

function cleanCountries(input) {
  const out = {};
  for (const [code, c] of Object.entries(input || DEFAULT_COUNTRIES)) {
    const cc = normalizeCountry(code);
    if (!/^[A-Z]{2}$/.test(cc) || !c) continue;
    const payments = (Array.isArray(c.payments) ? c.payments : []).filter((m) => ["card", "cod"].includes(m));
    out[cc] = {
      enabled: !!c.enabled,
      currency: String(c.currency || "USD").toUpperCase().slice(0, 3),
      rate: Math.max(0.0001, Number(c.rate) || 1),
      payments: payments.length ? payments : ["card"],
      own_stock: !!c.own_stock,
      local_delivery: {
        enabled: !!c.local_delivery?.enabled,
        areas: (c.local_delivery?.areas || []).map((a) => String(a).trim()).filter(Boolean).slice(0, 100),
      },
      min_days: Math.max(0, parseInt(c.min_days, 10) || 0),
      max_days: Math.max(0, parseInt(c.max_days, 10) || 0),
    };
  }
  return Object.keys(out).length ? out : DEFAULT_COUNTRIES;
}

app.put("/admin/settings", requireAuth, requirePermission("store"), async (req, res) => {
  const body = req.body || {};
  const value = {
    shipping: {
      standard_rate: Math.max(0, Number(body.shipping?.standard_rate) || 0),
      free_over: Math.max(0, Number(body.shipping?.free_over) || 0),
      min_days: Math.max(0, parseInt(body.shipping?.min_days, 10) || 0),
      max_days: Math.max(0, parseInt(body.shipping?.max_days, 10) || 0),
      zones: (body.shipping?.zones || [])
        .filter((z) => z && z.country)
        .map((z) => ({ country: normalizeCountry(z.country), rate: Math.max(0, Number(z.rate) || 0) })),
    },
    taxes: {
      enabled: !!body.taxes?.enabled,
      rates: (body.taxes?.rates || [])
        .filter((r) => r && r.country)
        .map((r) => ({
          country: normalizeCountry(r.country),
          state: r.state ? normalizeState(r.state) : "",
          rate: Math.max(0, Math.min(50, Number(r.rate) || 0)),
        })),
    },
    promo_bar: {
      enabled: !!body.promo_bar?.enabled,
      text: String(body.promo_bar?.text || "").slice(0, 140),
      ends_at: body.promo_bar?.ends_at ? new Date(body.promo_bar.ends_at).toISOString() : null,
      link: String(body.promo_bar?.link || "").slice(0, 300),
    },
    // Not sent by older screens (e.g. the app) → keep what is saved
    countries: body.countries ? cleanCountries(body.countries) : (await getShopSettings()).countries,
  };
  const { error } = await supabase
    .from("shop_settings")
    .upsert({ key: "shop", value, updated_at: new Date().toISOString() });
  if (error) return res.status(500).json({ error: error.message });
  settingsCache = null;
  res.json(value);
});


// ======================================================
// REVIEWS & RATINGS
// ======================================================

let ratingsCache = null;
let ratingsAt = 0;

// Public: { "<product id>": { avg: 4.5, count: 12 } }
app.get("/ratings", async (req, res) => {
  if (!ratingsCache || Date.now() - ratingsAt > 60000) {
    const { data } = await supabase.from("reviews").select("product_id, rating");
    const map = {};
    for (const r of data || []) {
      const m = (map[r.product_id] ||= { sum: 0, count: 0 });
      m.sum += r.rating;
      m.count += 1;
    }
    ratingsCache = Object.fromEntries(
      Object.entries(map).map(([id, m]) => [id, { avg: Math.round((m.sum / m.count) * 10) / 10, count: m.count }])
    );
    ratingsAt = Date.now();
  }
  res.json(ratingsCache);
});

app.get("/products/:id/reviews", async (req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, author_name, rating, title, body, created_at")
    .eq("product_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ reviews: data || [] });
});

async function hasBought(userId, productId) {
  const { data } = await supabase
    .from("orders")
    .select("id, order_items!inner(product_id)")
    .eq("user_id", userId)
    .in("status", ["paid", "processing", "shipped", "delivered"])
    .eq("order_items.product_id", productId)
    .limit(1);
  return (data || []).length > 0;
}

// Can the logged-in user review this product? (bought it)
app.get("/products/:id/can-review", requireAuth, async (req, res) => {
  res.json({ canReview: await hasBought(req.user.id, Number(req.params.id)) });
});

app.post("/products/:id/reviews", rateLimit("review", 10, 60 * 60 * 1000), requireAuth, async (req, res) => {
  const productId = Number(req.params.id);
  const rating = parseInt(req.body?.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: "Rating must be 1 to 5" });
  if (!(await hasBought(req.user.id, productId))) {
    return res.status(403).json({ error: "Only customers who bought this product can review it" });
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", req.user.id).maybeSingle();
  const name = profile?.full_name || req.user.user_metadata?.full_name || "Customer";
  const parts = name.trim().split(/\s+/);
  const author = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        product_id: productId,
        user_id: req.user.id,
        author_name: author,
        rating,
        title: String(req.body?.title || "").slice(0, 120),
        body: String(req.body?.body || "").slice(0, 2000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id,user_id" }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  ratingsCache = null;
  res.json({ review: data });
});

// Delete: the author, or staff who manage products
app.delete("/reviews/:id", requireAuth, async (req, res) => {
  const { data: review } = await supabase.from("reviews").select("id, user_id").eq("id", req.params.id).maybeSingle();
  if (!review) return res.status(404).json({ error: "Review not found" });
  const role = await getRole(req.user);
  const canModerate = (ROLE_PERMISSIONS[role] || []).includes("products");
  if (review.user_id !== req.user.id && !canModerate) {
    return res.status(403).json({ error: "Not allowed" });
  }
  await supabase.from("reviews").delete().eq("id", review.id);
  ratingsCache = null;
  res.json({ deleted: true });
});


// ======================================================
// HOME BANNERS
// ======================================================

app.get("/banners", async (req, res) => {
  const { data } = await supabase.from("banners").select("*").eq("active", true).order("sort").order("id");
  res.json({ banners: data || [] });
});

app.get("/admin/banners", requireAuth, requirePermission("store"), async (req, res) => {
  const { data, error } = await supabase.from("banners").select("*").order("sort").order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ banners: data || [] });
});

const BANNER_FIELDS = ["image", "title", "subtitle", "link", "button_label", "active", "sort"];
const pickBanner = (b) => Object.fromEntries(BANNER_FIELDS.filter((k) => b?.[k] !== undefined).map((k) => [k, b[k]]));

app.post("/admin/banners", requireAuth, requirePermission("store"), async (req, res) => {
  const banner = pickBanner(req.body);
  if (!banner.image) return res.status(400).json({ error: "Image is required" });
  const { data, error } = await supabase.from("banners").insert(banner).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ banner: data });
});

app.patch("/admin/banners/:id", requireAuth, requirePermission("store"), async (req, res) => {
  const { data, error } = await supabase.from("banners").update(pickBanner(req.body)).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ banner: data });
});

app.delete("/admin/banners/:id", requireAuth, requirePermission("store"), async (req, res) => {
  const { error } = await supabase.from("banners").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});


// ======================================================
// PROMO CODES (Stripe coupons — no extra Stripe fee)
// Customers type them on the Stripe payment page.
// ======================================================

async function couponOf(pc) {
  const ref = pc.promotion?.coupon ?? pc.coupon;
  if (!ref) return null;
  return typeof ref === "string" ? stripe.coupons.retrieve(ref) : ref;
}

app.get("/admin/promos", requireAuth, requirePermission("store"), async (req, res) => {
  try {
    const list = await stripe.promotionCodes.list({ limit: 100 });
    const promos = await Promise.all(
      list.data.map(async (pc) => {
        const coupon = await couponOf(pc).catch(() => null);
        return {
          id: pc.id,
          code: pc.code,
          active: pc.active,
          times_redeemed: pc.times_redeemed,
          max_redemptions: pc.max_redemptions,
          expires_at: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
          percent_off: coupon?.percent_off || null,
          amount_off: coupon?.amount_off ? coupon.amount_off / 100 : null,
        };
      })
    );
    res.json({ promos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/admin/promos", requireAuth, requirePermission("store"), async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const percent = Number(req.body?.percent_off);
    const amount = Number(req.body?.amount_off);
    if (!code) return res.status(400).json({ error: "Code is required" });
    if (!(percent > 0 && percent <= 100) && !(amount > 0)) {
      return res.status(400).json({ error: "Enter a percentage or an amount" });
    }

    const coupon = await stripe.coupons.create(
      percent > 0
        ? { percent_off: percent, duration: "once", name: code }
        : { amount_off: Math.round(amount * 100), currency: "usd", duration: "once", name: code }
    );

    const extra = {};
    if (req.body?.expires_at) extra.expires_at = Math.floor(new Date(req.body.expires_at).getTime() / 1000);
    if (Number(req.body?.max_redemptions) > 0) extra.max_redemptions = Number(req.body.max_redemptions);

    let pc;
    try {
      // Newer Stripe API versions
      pc = await stripe.promotionCodes.create({ code, promotion: { type: "coupon", coupon: coupon.id }, ...extra });
    } catch {
      // Older Stripe API versions
      pc = await stripe.promotionCodes.create({ code, coupon: coupon.id, ...extra });
    }
    res.json({ promo: { id: pc.id, code: pc.code } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/admin/promos/:id", requireAuth, requirePermission("store"), async (req, res) => {
  try {
    const pc = await stripe.promotionCodes.update(req.params.id, { active: !!req.body?.active });
    res.json({ promo: { id: pc.id, active: pc.active } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// ======================================================
// WELCOME EMAIL — sent once, the first time a user is logged in
// ======================================================

app.post("/me/welcome", rateLimit("welcome", 10, 60 * 60 * 1000), requireAuth, async (req, res) => {
  const meta = req.user.user_metadata || {};
  if (meta.welcome_sent) return res.json({ sent: false });

  const language = meta.language || req.body?.language || "en";
  await supabase.auth.admin.updateUserById(req.user.id, {
    user_metadata: { ...meta, welcome_sent: true, language },
  });
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", req.user.id).maybeSingle();
  emails.welcomeEmail({ to: req.user.email, name: profile?.full_name || meta.full_name, language });
  res.json({ sent: true });
});

// Remember the user's language (for emails)
app.post("/me/language", requireAuth, async (req, res) => {
  const language = String(req.body?.language || "").slice(0, 5);
  if (!language) return res.status(400).json({ error: "language required" });
  await supabase.auth.admin.updateUserById(req.user.id, {
    user_metadata: { ...(req.user.user_metadata || {}), language },
  });
  res.json({ success: true });
});


// ======================================================
// RETURN PAGE FOR THE MOBILE APP
// After paying in the phone's browser, Stripe sends the customer here.
// ======================================================

app.get("/checkout/return", async (req, res) => {
  if (!req.query.session_id) {
    return res.set("Content-Type", "text/html; charset=utf-8").send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>TechZhop</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#000;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0;padding:24px}p{color:#a1a1aa;font-size:18px}</style></head>
<body><div><div style="font-size:64px">↩️</div><p>Payment cancelled — you can close this page and return to the app.<br>Paiement annulé — vous pouvez fermer cette page.</p></div></body></html>`);
  }
  let ok = false;
  try {
    const { orderId } = await fulfillCheckoutSession(String(req.query.session_id || ""));
    ok = !!orderId;
  } catch (err) {
    console.error("RETURN PAGE ERROR:", err.message);
  }
  res.set("Content-Type", "text/html; charset=utf-8").send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TechZhop</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#000;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0;padding:24px}
h1{color:#06b6d4}p{color:#a1a1aa;font-size:18px}</style></head>
<body><div><div style="font-size:64px">${ok ? "✅" : "⏳"}</div>
<h1>TechZhop</h1>
<p>${ok ? "Payment received — thank you!" : "Payment is being confirmed."}</p>
<p>You can close this page and return to the app.<br>Vous pouvez fermer cette page et revenir à l'application.</p>
</div></body></html>`);
});


// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path:
        req.originalUrl,
    });
  }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      err
    );

    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: "File too large" });
    }
    res.status(err.status || 500).json({
      error: IS_PROD ? "Internal server error" : err.message || "Internal server error",
    });
  }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "🚀 TECHZHOP API SERVER"
    );
    console.log(
      "========================================"
    );
    console.log(
      `Port: ${PORT}`
    );
    console.log(
      `URL: http://localhost:${PORT}`
    );
    console.log(
      "Stripe: READY"
    );
    console.log(
      "Supabase: READY"
    );
    console.log(
      "========================================"
    );
    console.log("");
  }
);