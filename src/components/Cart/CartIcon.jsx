import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import useCartStore from "@/store/cartStore";

export default function CartIcon() {
  const { t } = useTranslation();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + Number(i.quantity || 0), 0));
  const load = useCartStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Link
      to="/cart"
      aria-label={t("nav.cart")}
      className="relative flex items-center text-white hover:text-cyan-400 transition"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
