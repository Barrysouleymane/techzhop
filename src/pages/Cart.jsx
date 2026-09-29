import { Link } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import useCart from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export default function Cart() {
  const { cart, loading, reloadCart } = useCart();

  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) {
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (error) {
      console.error("UPDATE CART ERROR:", error);
      alert(error.message);
      return;
    }

    await reloadCart();
  }

  async function removeItem(itemId) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("REMOVE CART ERROR:", error);
      alert(error.message);
      return;
    }

    await reloadCart();
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">
            Loading cart...
          </h1>
        </div>
      </MainLayout>
    );
  }

  const total = cart.reduce((sum, item) => {
    return (
      sum +
      Number(item.products?.price || 0) *
        Number(item.quantity || 0)
    );
  }, 0);

  const totalItems = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  return (
    <MainLayout>
      <section className="max-w-7xl mx-auto px-6 py-12">

        <h1 className="text-4xl font-bold mb-10">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">

            <div className="text-7xl mb-6">
              🛒
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Your cart is empty
            </h2>

            <Link
              to="/"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
            >
              Continue Shopping
            </Link>

          </div>
        ) : (

          <div className="grid lg:grid-cols-3 gap-10">

            {/* PRODUCTS */}

            <div className="lg:col-span-2 space-y-6">

              {cart.map((item) => {

                const product = item.products;

                const price = Number(
                  product?.price || 0
                );

                const quantity = Number(
                  item.quantity || 0
                );

                const subtotal = price * quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
                  >

                    <div className="flex gap-6">

                      {/* IMAGE */}

                      <img
                        src={product?.image}
                        alt={product?.name}
                        className="w-32 h-32 object-cover rounded-lg bg-zinc-800"
                      />

                      {/* INFO */}

                      <div className="flex-1">

                        <h2 className="text-xl font-bold">
                          {product?.name}
                        </h2>

                        <p className="text-cyan-400 text-lg mt-2">
                          ${price.toFixed(2)}
                        </p>

                        <p className="text-gray-400 mt-2">
                          Subtotal: ${subtotal.toFixed(2)}
                        </p>

                        {/* QUANTITY */}

                        <div className="flex items-center gap-3 mt-5">

                          <span className="text-gray-400">
                            Quantity:
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                quantity - 1
                              )
                            }
                            disabled={quantity <= 1}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
                          >
                            −
                          </button>

                          <span className="w-10 text-center font-bold">
                            {quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                quantity + 1
                              )
                            }
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                          >
                            +
                          </button>

                        </div>

                        {/* REMOVE */}

                        <button
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="mt-5 text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* SUMMARY */}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">

              <h2 className="text-2xl font-bold mb-6">
                Order Summary
              </h2>

              <div className="flex justify-between mb-4">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="flex justify-between mb-4">
                <span>Products</span>
                <span>{cart.length}</span>
              </div>

              <div className="border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold">

                <span>
                  Total
                </span>

                <span className="text-cyan-400">
                  ${total.toFixed(2)}
                </span>

              </div>

              <Link
                to="/checkout"
                className="block text-center mt-8 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 rounded-lg"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/"
                className="block text-center mt-4 border border-zinc-700 hover:bg-zinc-800 py-3 rounded-lg"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        )}

      </section>
    </MainLayout>
  );
}