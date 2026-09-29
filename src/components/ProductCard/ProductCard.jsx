import { Link } from "react-router-dom";
import { cartAdd } from "@/services/cartService";

export default function ProductCard({ product }) {
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

      <Link to={`/product/${product.id}`}>
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