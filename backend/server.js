require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 8000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      FRONTEND_URL,
    ],
    credentials: true,
  })
);


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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      total: Number(session.amount_total || 0) / 100,
      shipping_address: session.metadata?.shipping_address || null,
      status: "paid",
      created_at: now,
      updated_at: now,
    })
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

  const orderItems = lineItems.data.map((item) => {
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

  // Reduce stock
  for (const item of orderItems) {
    if (!item.product_id) continue;
    const { data: p } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .maybeSingle();
    if (p && p.stock != null) {
      await supabase
        .from("products")
        .update({ stock: Math.max(0, Number(p.stock) - item.quantity) })
        .eq("id", item.product_id);
    }
  }

  // Empty the customer's cart
  if (userId) {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }

  console.log("🧾 ORDER CREATED:", order.id, "items:", orderItems.length);
  await sendOrderPush(userId, order.id, "paid");

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
  admin: ["products", "orders", "team", "revenue"],
  product_manager: ["products"],
  seller: ["orders"],
  customer: [],
};
const STAFF_ROLES = ["admin", "product_manager", "seller"];

function isOwnerEmail(email) {
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

async function getRole(user) {
  if (!user) return "customer";
  if (isOwnerEmail(user.email)) return "admin";
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return ROLE_PERMISSIONS[data?.role] ? data.role : "customer";
}

/** requirePermission("products") — also sets req.role / req.permissions */
function requirePermission(...needed) {
  return async (req, res, next) => {
    try {
      const role = await getRole(req.user);
      const permissions = ROLE_PERMISSIONS[role] || [];
      req.role = role;
      req.permissions = permissions;
      const ok = needed.length === 0
        ? STAFF_ROLES.includes(role)
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

app.post(
  "/create-checkout-session",
  requireAuth,
  async (req, res) => {
    try {
      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "🛒 CHECKOUT REQUEST"
      );
      console.log(
        "BODY:",
        JSON.stringify(
          req.body,
          null,
          2
        )
      );
      console.log(
        "========================================"
      );

      const {
        items,
      } = req.body;

      // The user comes from the verified token, never from the request body
      const user_id = req.user.id;

      // ----------------------------------------------
      // Validate cart
      // ----------------------------------------------

      if (
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          error: "Cart is empty",
        });
      }

      // ----------------------------------------------
      // Validate user
      // ----------------------------------------------

      if (!user_id) {
        return res.status(400).json({
          error:
            "User ID is required for checkout",
        });
      }

      // ----------------------------------------------
      // Product IDs
      // ----------------------------------------------

      const productIds =
        items
          .map((item) =>
            Number(item.product_id)
          )
          .filter((id) =>
            Number.isInteger(id)
          );

      if (
        productIds.length === 0
      ) {
        return res.status(400).json({
          error:
            "No valid product IDs found",
        });
      }

      console.log(
        "PRODUCT IDS:",
        productIds
      );

      // ----------------------------------------------
      // Get products from Supabase
      // ----------------------------------------------

      const {
        data: products,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          "id,name,price,image,stock"
        )
        .in(
          "id",
          productIds
        );

      if (productsError) {
        console.error(
          "SUPABASE PRODUCTS ERROR:",
          productsError
        );

        return res.status(500).json({
          error:
            productsError.message,
        });
      }

      if (
        !products ||
        products.length === 0
      ) {
        return res.status(400).json({
          error:
            "No products found",
        });
      }

      console.log(
        "PRODUCTS FOUND:",
        products
      );

      // ----------------------------------------------
      // Build Stripe line items
      // ----------------------------------------------

      const line_items =
        items.map((item) => {
          const productId =
            Number(
              item.product_id
            );

          const product =
            products.find(
              (p) =>
                Number(p.id) ===
                productId
            );

          if (!product) {
            throw new Error(
              `Product ${productId} not found`
            );
          }

          const quantity =
            Number(
              item.quantity
            );

          if (
            !Number.isInteger(
              quantity
            ) ||
            quantity <= 0
          ) {
            throw new Error(
              `Invalid quantity for ${product.name}`
            );
          }

          const price =
            Number(
              product.price
            );

          if (
            !Number.isFinite(
              price
            ) ||
            price <= 0
          ) {
            throw new Error(
              `Invalid price for ${product.name}`
            );
          }

          return {
            price_data: {
              currency: "usd",

              product_data: {
                name:
                  product.name,

                metadata: {
                  product_id:
                    String(
                      product.id
                    ),
                },
              },

              unit_amount:
                Math.round(
                  price * 100
                ),
            },

            quantity,
          };
        });

      // ----------------------------------------------
      // Create Stripe Checkout
      // ----------------------------------------------

      const session =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            payment_method_types: [
              "card",
            ],

            line_items,

            metadata: {
              user_id:
                String(user_id),
              // Chosen delivery address (Stripe metadata max 500 chars)
              shipping_address: String(
                req.body.shipping_address || ""
              ).slice(0, 490),
            },

            success_url:
              req.body.return_to === "app"
                ? `${req.protocol}://${req.get("host")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
                : `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
              `${FRONTEND_URL}/cart`,

            billing_address_collection:
              "auto",

            phone_number_collection: {
              enabled: true,
            },

            shipping_address_collection: {
              allowed_countries: [
                "US",
                "CA",
              ],
            },
          }
        );

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "✅ STRIPE SESSION CREATED"
      );
      console.log(
        "SESSION ID:",
        session.id
      );
      console.log(
        "URL:",
        session.url
      );
      console.log(
        "========================================"
      );

      res.json({
        success: true,
        id: session.id,
        url: session.url,
      });

    } catch (err) {
      console.error("");
      console.error(
        "❌ STRIPE CHECKOUT ERROR:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to create checkout session",
      });
    }
  }
);


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

      const { admin_note, ...publicOrder } = data;

      res.json({
        success: true,
        order: publicOrder,
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
// DELETE MY ACCOUNT
// Removes the user's personal data and login.
// Orders are kept (accounting) but detached from the user.
// ======================================================

app.delete("/account", requireAuth, async (req, res) => {
  const userId = req.user.id;

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
      "id, user_id, total, status, tracking_number, shipping_address, created_at, updated_at, order_items (id, product_id, product_name, price, quantity)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, orders: data || [] });
});



// Which columns exist in "orders" (detected, refreshed every minute)
let orderColumnsCache = null;
let orderColumnsAt = 0;

async function orderColumns() {
  if (orderColumnsCache && Date.now() - orderColumnsAt < 60000) return orderColumnsCache;
  const { data } = await supabase.from("orders").select("*").limit(1);
  if (data?.[0]) {
    orderColumnsCache = Object.keys(data[0]);
    orderColumnsAt = Date.now();
  }
  return orderColumnsCache || [];
}

// ADMIN — ONE ORDER WITH CUSTOMER, PRODUCTS AND PAYMENT DETAILS
app.get("/admin/orders/:orderId", requireAuth, requirePermission("orders"), async (req, res) => {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items (id, product_id, product_name, price, quantity)")
    .eq("id", req.params.orderId)
    .single();

  if (error) return res.status(404).json({ error: error.message });

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
    fields: { carrier: cols.includes("carrier"), note: cols.includes("admin_note") },
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
  for (const key of ["carrier", "admin_note"]) {
    if (req.body?.[key] !== undefined && orderCols.includes(key)) {
      update[key] = req.body[key] || null;
    }
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

  if (status) {
    await sendOrderPush(data.user_id, data.id, data.status);
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
  if (out.category_id === "") out.category_id = null;
  if (out.brand_id === "") out.brand_id = null;

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
  const role = await getRole(req.user);
  res.json({
    admin: STAFF_ROLES.includes(role),
    role,
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
    .select("id, full_name, avatar_url, role")
    .in("role", STAFF_ROLES);
  if (error) return res.status(500).json({ error: error.message });

  const members = await Promise.all(
    (staff || []).map(async (p) => {
      const { data } = await supabase.auth.admin.getUserById(p.id);
      const email = data?.user?.email || null;
      return { ...p, email, owner: isOwnerEmail(email) };
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

app.post("/admin/team", requireAuth, requirePermission("team"), async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const role = String(req.body?.role || "");
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!STAFF_ROLES.includes(role) && role !== "customer") {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (isOwnerEmail(email)) {
    return res.status(400).json({ error: "The shop owner is always admin" });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "No account with this email. Ask the person to sign up first." });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role }, { onConflict: "id" });
  if (error) return res.status(500).json({ error: error.message });

  console.log(`👥 ROLE: ${email} → ${role} (by ${req.user.email})`);
  res.json({ success: true, member: { id: user.id, email, role } });
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

app.post("/admin/upload", requireAuth, requirePermission("products"), async (req, res) => {
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
// RETURN PAGE FOR THE MOBILE APP
// After paying in the phone's browser, Stripe sends the customer here.
// ======================================================

app.get("/checkout/return", async (req, res) => {
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

    res.status(500).json({
      error:
        err.message ||
        "Internal server error",
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