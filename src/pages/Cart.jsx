import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Page, { btnPrimary, btnSecondary, card } from "@/components/Page";
import useCart from "@/hooks/useCart";
import useCartStore from "@/store/cartStore";
import useMoney from "@/hooks/useMoney";
import useAuth from "@/hooks/useAuth";

export default function Cart() {
  const { t } = useTranslation();
  const money = useMoney();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading } = useCart();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  const run = (fn) => fn().catch(() => toast.error(t("common.error")));

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

  const total = cart.reduce((s, i) => s + Number(i.products?.price || 0) * Number(i.quantity || 0), 0);
  const totalItems = cart.reduce((s, i) => s + Number(i.quantity || 0), 0);

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
                  <p className="text-cyan-400 text-lg mt-1 mb-0">{money(p?.price)}</p>
                  <p className="text-gray-400 mt-1">{t("cart.subtotal")}: {money(Number(p?.price || 0) * qty)}</p>
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
          <h2 className="text-2xl font-bold mb-6">{t("cart.summary")}</h2>
          <div className="flex justify-between mb-3"><span>{t("cart.items")}</span><span>{totalItems}</span></div>
          <div className="flex justify-between mb-3"><span>{t("cart.products")}</span><span>{cart.length}</span></div>
          <div className="border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold">
            <span>{t("cart.total")}</span>
            <span className="text-cyan-400">{money(total)}</span>
          </div>
          <Link to="/checkout" className={`${btnPrimary} w-full mt-8 py-4`}>{t("cart.checkout")}</Link>
          <Link to="/products" className={`${btnSecondary} w-full mt-3`}>{t("cart.continueShopping")}</Link>
        </div>
      </div>
    </Page>
  );
}
