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

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log(
          "CHECKOUT SESSION:",
          session.id
        );

        console.log(
          "PAYMENT STATUS:",
          session.payment_status
        );

        console.log(
          "CUSTOMER EMAIL:",
          session.customer_details?.email || null
        );

        const userId =
          session.metadata?.user_id || null;

        const total =
          Number(session.amount_total || 0) / 100;

        // ------------------------------------------------
        // Avoid duplicate orders
        // ------------------------------------------------

        const {
          data: existingOrder,
          error: existingOrderError,
        } = await supabase
          .from("orders")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existingOrderError) {
          console.error(
            "CHECK EXISTING ORDER ERROR:",
            existingOrderError
          );

          return res.status(500).json({
            error: existingOrderError.message,
          });
        }

        if (existingOrder) {
          console.log(
            "ℹ️ ORDER ALREADY EXISTS:",
            existingOrder.id
          );

          return res.json({
            received: true,
            already_processed: true,
          });
        }

        // ------------------------------------------------
        // Retrieve Stripe line items
        // ------------------------------------------------

        const lineItems =
          await stripe.checkout.sessions.listLineItems(
            session.id,
            {
              limit: 100,
            }
          );

        console.log(
          "LINE ITEMS:",
          lineItems.data.length
        );

        // ------------------------------------------------
        // Create order
        // ------------------------------------------------

        const {
          data: order,
          error: orderError,
        } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            total,
            status:
              session.payment_status === "paid"
                ? "paid"
                : "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) {
          console.error(
            "❌ CREATE ORDER ERROR:",
            orderError
          );

          return res.status(500).json({
            error: orderError.message,
          });
        }

        console.log(
          "✅ ORDER CREATED:",
          order.id
        );

        // ------------------------------------------------
        // Create order items
        // ------------------------------------------------

        const orderItems =
          lineItems.data.map((item) => {
            const productId =
              item.price?.product_data?.metadata
                ?.product_id
                ? Number(
                    item.price.product_data.metadata
                      .product_id
                  )
                : null;

            const productName =
              item.description ||
              item.price?.product_data?.name ||
              "Product";

            const price =
              Number(
                item.price?.unit_amount || 0
              ) / 100;

            const quantity =
              Number(item.quantity || 1);

            return {
              order_id: order.id,
              product_id: productId,
              product_name: productName,
              price,
              quantity,
              created_at: new Date().toISOString(),
            };
          });

        if (orderItems.length > 0) {
          const {
            error: orderItemsError,
          } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (orderItemsError) {
            console.error(
              "❌ CREATE ORDER ITEMS ERROR:",
              orderItemsError
            );

            return res.status(500).json({
              error: orderItemsError.message,
            });
          }
        }

        console.log(
          "✅ ORDER ITEMS CREATED:",
          orderItems.length
        );

        // ------------------------------------------------
        // Clear cart
        // ------------------------------------------------

        if (userId) {
          const {
            error: cartDeleteError,
          } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId);

          if (cartDeleteError) {
            console.error(
              "❌ CART DELETE ERROR:",
              cartDeleteError
            );
          } else {
            console.log(
              "🛒 CART CLEARED FOR USER:",
              userId
            );
          }
        } else {
          console.log(
            "⚠️ No user_id in Stripe metadata."
          );
        }

        console.log("");
        console.log("========================================");
        console.log("✅ ORDER PROCESSING COMPLETE");
        console.log("ORDER ID:", order.id);
        console.log("TOTAL:", total);
        console.log("STATUS:", order.status);
        console.log("========================================");
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

app.use(express.json());


// ======================================================
// HOME
// ======================================================

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

function requireAdmin(req, res, next) {
  const email = (req.user?.email || "").toLowerCase();

  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "Admin access only" });
  }

  next();
}


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

app.post("/products", requireAuth, requireAdmin, async (req, res) => {
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
            },

            success_url:
              `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

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

      const session =
        await stripe.checkout.sessions.retrieve(
          sessionId
        );

      res.json({
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
            id,
            user_id,
            stripe_session_id,
            total,
            status,
            created_at,
            updated_at,
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
        orders:
          data || [],
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
            id,
            user_id,
            stripe_session_id,
            total,
            status,
            created_at,
            updated_at,
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

      res.json({
        success: true,
        order: data,
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