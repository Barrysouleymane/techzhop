import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { MapPin } from "lucide-react";
import Page, { btnPrimary, btnSecondary, card } from "@/components/Page";
import useCart from "@/hooks/useCart";
import useMoney, { useCurrency } from "@/hooks/useMoney";
import useAuth from "@/hooks/useAuth";
import { API_URL } from "@/config/constants";
import { authHeaders, getAddresses, apiError } from "@/api/account";
import { formatAddress, formatUSD } from "../../shared/settings";

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const currency = useCurrency();
  const { user } = useAuth();
  const { cart, loading } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getAddresses(user.id)
      .then((list) => {
        setAddresses(list);
        setAddressId((list.find((a) => a.is_default) || list[0])?.id ?? null);
      })
      .catch(() => {});
  }, [user]);

  const total = cart.reduce((s, i) => s + Number(i.products?.price || 0) * Number(i.quantity || 0), 0);
  const totalItems = cart.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const address = addresses.find((a) => a.id === addressId);

  async function handleCheckout() {
    setProcessing(true);
    setError("");
    try {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        name: item.products?.name,
        price: Number(item.products?.price || 0),
        quantity: Number(item.quantity || 0),
      }));

      if (items.some((i) => !i.name || !(i.price > 0) || !(i.quantity > 0))) {
        throw new Error(t("checkout.invalidItem"));
      }

      const res = await axios.post(
        `${API_URL}/create-checkout-session`,
        { items, shipping_address: formatAddress(address) },
        { headers: await authHeaders() }
      );

      if (!res.data?.url) throw new Error(t("checkout.failed"));
      window.location.href = res.data.url;
    } catch (err) {
      setError(apiError(err, t));
      setProcessing(false);
    }
  }

  if (loading) return <Page><p className="text-center py-20">{t("common.loading")}</p></Page>;

  if (cart.length === 0) {
    return (
      <Page title={t("checkout.title")}>
        <div className="text-center py-16">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold mb-6">{t("cart.empty")}</h2>
          <Link to="/products" className={btnPrimary}>{t("cart.continueShopping")}</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("checkout.title")} width="max-w-7xl" back="/cart" backLabel={t("checkout.backToCart")}>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* DELIVERY ADDRESS */}
          <div className={`${card} p-6`}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-cyan-400" /> {t("checkout.shipTo")}
            </h2>
            {addresses.length === 0 ? (
              <Link to="/addresses" state={{ from: "/checkout" }} className={btnSecondary}>
                {t("checkout.addAddress")}
              </Link>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${a.id === addressId ? "border-cyan-500" : "border-zinc-800"}`}>
                    <input type="radio" name="address" checked={a.id === addressId} onChange={() => setAddressId(a.id)} />
                    <span>
                      {a.label && <strong className="block">{a.label}</strong>}
                      <span className="text-gray-400 text-sm">{formatAddress(a)}</span>
                    </span>
                  </label>
                ))}
                <Link to="/addresses" state={{ from: "/checkout" }} className="text-cyan-400 text-sm no-underline">
                  {t("checkout.changeAddress")}
                </Link>
              </div>
            )}
          </div>

          {cart.map((item) => {
            const p = item.products;
            const qty = Number(item.quantity || 0);
            return (
              <div key={item.id} className={`${card} p-4 flex gap-4`}>
                <div className="bg-white w-20 h-20 rounded-lg flex items-center justify-center shrink-0">
                  <img src={p?.image} alt={p?.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{p?.name}</h3>
                  <p className="text-gray-400 m-0">{t("cart.quantity")}: {qty}</p>
                  <p className="text-cyan-400 font-bold m-0">{money(Number(p?.price || 0) * qty)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${card} p-6 h-fit`}>
          <h2 className="text-2xl font-bold mb-6">{t("cart.summary")}</h2>
          <div className="flex justify-between mb-3"><span>{t("cart.products")}</span><span>{cart.length}</span></div>
          <div className="flex justify-between mb-3"><span>{t("cart.items")}</span><span>{totalItems}</span></div>
          <div className="border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold">
            <span>{t("cart.total")}</span>
            <span className="text-cyan-400">{money(total)}</span>
          </div>
          {currency !== "USD" && (
            <p className="text-gray-400 text-sm mt-3 mb-0">
              {t("checkout.chargedInUsd", { amount: formatUSD(total, i18n.language) })}
            </p>
          )}

          {error && <div className="mt-6 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}

          <button onClick={handleCheckout} disabled={processing} className={`${btnPrimary} w-full mt-8 py-4`}>
            {processing ? t("checkout.redirecting") : t("checkout.pay")}
          </button>
        </div>
      </div>
    </Page>
  );
}
