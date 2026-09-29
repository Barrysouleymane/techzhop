import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { cartAdd } from "@/services/cartService";
import useWishlistStore from "@/store/wishlistStore";

export default function ProductCard({ product }) {
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) =>
    s.items.some((p) => p.id === product.id)
  );

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      await cartAdd(product.id);

      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);
      alert(error.message);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-cyan-500 transition">

      <Link to={`/product/${product.id}`} className="relative block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black rounded-full p-2 transition"
        >
          <Heart
            className={`w-5 h-5 ${inWishlist ? "fill-pink-500 text-pink-500" : "text-white"}`}
          />
        </button>

        <div className="bg-white h-64 flex items-center justify-center">

          <img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />

        </div>
      </Link>

      <div className="p-5">

        <Link to={`/product/${product.id}`}>
          <h3 className="text-xl font-bold text-white hover:text-cyan-400 transition">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-400 text-sm mt-2">
          Brand: {product.brands?.name || product.brand || "N/A"}
        </p>

        <p className="text-gray-400 text-sm">
          Category: {product.categories?.name || product.category || "N/A"}
        </p>

        <p className="text-cyan-400 text-2xl font-bold mt-4">
          ${Number(product.price).toFixed(2)}
        </p>

        <p className="text-gray-400 text-sm mt-2">
          Stock: {product.stock}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={!product.stock || product.stock <= 0}
          className="mt-5 w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition"
        >
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>

      </div>

    </div>
  );
}