import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import MainLayout from "@/layouts/MainLayout";
import useCart from "@/hooks/useCart";

export default function Checkout() {
  const { cart, loading } = useCart();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // TOTAL
  // ========================================

  const total = cart.reduce((sum, item) => {
    const product = item.products;

    const price = Number(product?.price || 0);
    const quantity = Number(item.quantity || 0);

    return sum + price * quantity;
  }, 0);

  // ========================================
  // TOTAL ITEMS
  // ========================================

  const totalItems = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  // ========================================
  // STRIPE CHECKOUT
  // ========================================

  async function handleCheckout() {
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      // IMPORTANT:
      // Send name + price + quantity to backend
      const items = cart.map((item) => {
        const product = item.products;

        return {
          product_id: item.product_id,

          name: product?.name,

          price: Number(product?.price || 0),

          quantity: Number(item.quantity || 0),
        };
      });

      console.log("================================");
      console.log("CHECKOUT ITEMS:");
      console.log(items);
      console.log("================================");

      // Check for missing product information
      const invalidItem = items.find(
        (item) =>
          !item.name ||
          !Number.isFinite(item.price) ||
          item.price <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
      );

      if (invalidItem) {
        console.error(
          "INVALID CHECKOUT ITEM:",
          invalidItem
        );

        throw new Error(
          "One of the products in your cart is invalid."
        );
      }

      // ========================================
      // SEND TO BACKEND
      // ========================================

      const response = await axios.post(
        "http://localhost:8000/create-checkout-session",
        {
          items,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("CHECKOUT RESPONSE:");
      console.log(response.data);

      // ========================================
      // STRIPE URL
      // ========================================

      if (!response.data?.url) {
        throw new Error(
          "Stripe Checkout URL is missing."
        );
      }

      // ========================================
      // REDIRECT TO STRIPE
      // ========================================

      window.location.href = response.data.url;
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);

      console.error(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to start checkout."
      );

      setProcessing(false);
    }
  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <MainLayout>
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-gray-400">
            Loading checkout...
          </div>
        </section>
      </MainLayout>
    );
  }

  // ========================================
  // EMPTY CART
  // ========================================

  if (cart.length === 0) {
    return (
      <MainLayout>
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center py-20">

            <div className="text-7xl mb-6">
              🛒
            </div>

            <h1 className="text-4xl font-bold mb-6">
              Your cart is empty
            </h1>

            <Link
              to="/"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
            >
              Continue Shopping
            </Link>

          </div>
        </section>
      </MainLayout>
    );
  }

  // ========================================
  // CHECKOUT PAGE
  // ========================================

  return (
    <MainLayout>

      <section className="max-w-7xl mx-auto px-6 py-16">

        <h1 className="text-4xl font-bold mb-10">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* ================================= */}
          {/* PRODUCTS */}
          {/* ================================= */}

          <div className="lg:col-span-2 space-y-6">

            {cart.map((item) => {
              const product = item.products;

              const price = Number(
                product?.price || 0
              );

              const quantity = Number(
                item.quantity || 0
              );

              const subtotal =
                price * quantity;

              return (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
                >

                  <div className="flex gap-6">

                    {/* IMAGE */}

                    <img
                      src={product?.image}
                      alt={product?.name || "Product"}
                      className="w-32 h-32 object-cover rounded-lg bg-zinc-800"
                    />

                    {/* INFORMATION */}

                    <div className="flex-1">

                      <h2 className="text-xl font-bold">
                        {product?.name}
                      </h2>

                      <p className="text-cyan-400 text-lg mt-2">
                        ${price.toFixed(2)}
                      </p>

                      <p className="text-gray-400 mt-2">
                        Quantity: {quantity}
                      </p>

                      <p className="text-gray-300 mt-2">
                        Subtotal: $
                        {subtotal.toFixed(2)}
                      </p>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

          {/* ================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================= */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">

            <h2 className="text-2xl font-bold mb-6">
              Order Summary
            </h2>

            <div className="flex justify-between mb-4">
              <span>Products</span>

              <span>
                {cart.length}
              </span>
            </div>

            <div className="flex justify-between mb-4">
              <span>Items</span>

              <span>
                {totalItems}
              </span>
            </div>

            <div className="border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold">

              <span>
                Total
              </span>

              <span className="text-cyan-400">
                ${total.toFixed(2)}
              </span>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* PAY */}

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full mt-8 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold py-4 rounded-lg"
            >
              {processing
                ? "Redirecting to Stripe..."
                : "Pay Now"}
            </button>

            {/* BACK */}

            <Link
              to="/cart"
              className="block text-center mt-4 border border-zinc-700 hover:bg-zinc-800 py-3 rounded-lg"
            >
              Back to Cart
            </Link>

          </div>

        </div>

      </section>

    </MainLayout>
  );
}