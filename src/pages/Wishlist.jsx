import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import useWishlistStore from "@/store/wishlistStore";
import { cartAdd } from "@/services/cartService";

export default function Wishlist() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);

  async function moveToCart(product) {
    try {
      await cartAdd(product.id);
      remove(product.id);
      alert(`${product.name} added to cart!`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <MainLayout>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart className="w-14 h-14 mx-auto mb-4" />
            <p>Your wishlist is empty.</p>
            <Link
              to="/products"
              className="inline-block mt-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-5 bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <Link
                  to={`/product/${p.id}`}
                  className="bg-white w-24 h-24 rounded-lg flex items-center justify-center shrink-0"
                >
                  <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="font-bold text-lg hover:text-cyan-400">
                    {p.name}
                  </Link>
                  <p className="text-cyan-400 font-bold mt-1">
                    ${Number(p.price).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => moveToCart(p)}
                  disabled={!p.stock || p.stock <= 0}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-bold px-4 py-2 rounded-lg"
                >
                  Add to cart
                </button>

                <button
                  onClick={() => remove(p.id)}
                  aria-label="Remove"
                  className="p-2 hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MainLayout>
  );
}
