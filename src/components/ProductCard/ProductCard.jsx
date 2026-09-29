import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import useWishlistStore from "@/store/wishlistStore";
import useCartStore from "@/store/cartStore";
import PriceTag from "@/components/Shop/PriceTag";
import Stars from "@/components/Shop/Stars";
import Countdown from "@/components/Shop/Countdown";
import useShopStore from "@/store/shopStore";
import { isOnSale, discountPercent } from "../../../shared/settings";

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rating = useShopStore((s) => s.ratings[product.id]);
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => s.items.some((p) => p.id === product.id));

  const inStock = Number(product.stock) > 0;

  async function handleAddToCart(e) {
    e.preventDefault();
    try {
      await addToCart(product.id);
      toast.success(t("product.addedToCart", { name: product.name }), {
        action: { label: t("product.viewCart"), onClick: () => navigate("/cart") },
      });
    } catch (err) {
      if (err.code === "LOGIN_REQUIRED") {
        toast.error(t("product.loginFirst"));
        navigate("/login", { state: { from: `/product/${product.id}` } });
      } else {
        toast.error(t("common.error"));
      }
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-cyan-500 transition flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={inWishlist ? t("product.removeFromWishlist") : t("product.addToWishlist")}
          className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black rounded-full p-2 transition"
        >
          <Heart className={`w-5 h-5 ${inWishlist ? "fill-pink-500 text-pink-500" : "text-white"}`} />
        </button>

        {isOnSale(product) && (
          <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold rounded px-2 py-1">
            {t("product.off", { percent: discountPercent(product) })}
          </span>
        )}
        <div className="bg-white h-56 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="no-underline">
          <h3 className="text-lg font-bold text-white hover:text-cyan-400 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-400 text-sm mt-1 mb-0">
          {product.brands?.name || product.categories?.name || " "}
        </p>

        {rating && <div className="mt-1"><Stars value={rating.avg} count={rating.count} size={14} /></div>}
        <div className="mt-2"><PriceTag product={product} /></div>
        {isOnSale(product) && product.sale_ends_at && <Countdown until={product.sale_ends_at} compact />}

        <p className={`text-sm mt-1 ${inStock ? "text-gray-400" : "text-red-400"}`}>
          {inStock ? t("product.inStock", { count: product.stock }) : t("product.outOfStock")}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="mt-auto w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition"
        >
          {inStock ? t("product.addToCart") : t("product.outOfStock")}
        </button>
      </div>
    </div>
  );
}
