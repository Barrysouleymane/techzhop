import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Page, { btnPrimary, card } from "@/components/Page";
import useWishlistStore from "@/store/wishlistStore";
import useCartStore from "@/store/cartStore";
import useMoney from "@/hooks/useMoney";

export default function Wishlist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const money = useMoney();
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.add);

  async function moveToCart(p) {
    try {
      await addToCart(p.id);
      remove(p.id);
      toast.success(t("product.addedToCart", { name: p.name }));
    } catch (err) {
      if (err.code === "LOGIN_REQUIRED") navigate("/login", { state: { from: "/wishlist" } });
      else toast.error(t("common.error"));
    }
  }

  return (
    <Page title={t("wishlist.title")}>
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Heart className="w-14 h-14 mx-auto mb-4" />
          <p>{t("wishlist.empty")}</p>
          <p className="text-sm">{t("wishlist.hint")}</p>
          <Link to="/products" className={btnPrimary}>{t("wishlist.browse")}</Link>
        </div>
      ) : (
        <ul className="list-none p-0 space-y-4">
          {items.map((p) => (
            <li key={p.id} className={`${card} flex items-center gap-4 p-4`}>
              <Link to={`/product/${p.id}`} className="bg-white w-20 h-20 rounded-lg flex items-center justify-center shrink-0">
                <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${p.id}`} className="font-bold text-lg text-white hover:text-cyan-400 no-underline">{p.name}</Link>
                <p className="text-cyan-400 font-bold mt-1 mb-0">{money(p.price)}</p>
              </div>
              <button onClick={() => moveToCart(p)} disabled={!(p.stock > 0)} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-bold px-4 py-2 rounded-lg">
                {t("product.addToCart")}
              </button>
              <button onClick={() => remove(p.id)} aria-label={t("common.delete")} className="p-2 text-red-400">
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
