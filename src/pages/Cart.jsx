import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Page, { btnPrimary, btnSecondary, card } from "@/components/Page";
import useCart from "@/hooks/useCart";
import useCartStore from "@/store/cartStore";
import useMoney from "@/hooks/useMoney";
import useAuth from "@/hooks/useAuth";
import PriceTag from "@/components/Shop/PriceTag";
import OrderSummary from "@/components/Shop/OrderSummary";
import { getAddresses } from "@/api/account";
import { useEffect, useState } from "react";
import { effectivePrice } from "../../shared/settings";

export default function Cart() {
  const { t } = useTranslation();
  const money = useMoney();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading } = useCart();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  const run = (fn) => fn().catch(() => toast.error(t("common.error")));
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (user) getAddresses(user.id).then((l) => setAddress(l.find((a) => a.is_default) || l[0] || null)).catch(() => {});
  }, [user]);

  if (loading || authLoading) return <Page><p className="text-center py-20">{t("common.loading")}</p></Page>;

  if (!user) {
    return (
      <Page title={t("cart.title")}>
        <div className="text-center py-16">
          <p className="text-gray-400">{t("cart.loginToSee")}</p>
          <Link to="/login" state={{ from: "/cart" }} className={btnPrimary}>{t("auth.login")}</Link>
        </div>
      </Page>
    );
  }


  if (cart.length === 0) {
    return (
      <Page title={t("cart.title")}>
        <div className="text-center py-16">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold mb-6">{t("cart.empty")}</h2>
          <Link to="/products" className={btnPrimary}>{t("cart.continueShopping")}</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("cart.title")} width="max-w-7xl">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const p = item.products;
            const qty = Number(item.quantity || 0);
            return (
              <div key={item.id} className={`${card} p-4 sm:p-6 flex gap-4 sm:gap-6`}>
                <Link to={`/product/${p?.id}`} className="bg-white w-24 h-24 sm:w-32 sm:h-32 rounded-lg flex items-center justify-center shrink-0">
                  <img src={p?.image} alt={p?.name} className="max-h-full max-w-full object-contain" />
                </Link>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">{p?.name}</h2>
                  <div className="mt-1"><PriceTag product={p} /></div>
                  <p className="text-gray-400 mt-1">{t("cart.subtotal")}: {money(effectivePrice(p) * qty)}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-gray-400">{t("cart.quantity")}:</span>
                    <button onClick={() => run(() => setQuantity(item.id, qty - 1))} disabled={qty <= 1} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white">−</button>
                    <span className="w-8 text-center font-bold">{qty}</span>
                    <button onClick={() => run(() => setQuantity(item.id, qty + 1))} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white">+</button>
                    <button onClick={() => run(() => remove(item.id))} className="ml-auto text-red-400 hover:text-red-300">{t("cart.remove")}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${card} p-6 h-fit`}>
          <OrderSummary cart={cart} address={address} />
          <Link to="/checkout" className={`${btnPrimary} w-full mt-8 py-4`}>{t("cart.checkout")}</Link>
          <Link to="/products" className={`${btnSecondary} w-full mt-3`}>{t("cart.continueShopping")}</Link>
        </div>
      </div>
    </Page>
  );
}
