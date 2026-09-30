import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { MapPin, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import useShopStore from "@/store/shopStore";
import useCartStore from "@/store/cartStore";
import Page, { btnPrimary, btnSecondary, card } from "@/components/Page";
import useCart from "@/hooks/useCart";
import useMoney from "@/hooks/useMoney";
import OrderSummary from "@/components/Shop/OrderSummary";
import useAuth from "@/hooks/useAuth";
import { API_URL } from "@/config/constants";
import useDeliveryLocation from "@/hooks/useDeliveryLocation";
import useLocationStore from "@/store/locationStore";
import { authHeaders, getAddresses, apiError } from "@/api/account";
import { formatAddress, effectivePrice, countryCfg, normalizeCountry, countryName, quote, localAmount, formatLocal, isLocalDelivery, needsLandmark } from "../../shared/settings";

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const { user } = useAuth();
  const { cart, loading } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressIdState] = useState(null);
  const chosen = useDeliveryLocation().address;
  const setChoice = useLocationStore((s) => s.setChoice);
  const setAddressId = (id) => {
    setAddressIdState(id);
    if (id) setChoice({ type: "address", id });
  };
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState(null); // "card" | "cod"
  const settings = useShopStore((s) => s.settings);
  const reloadCart = useCartStore((s) => s.load);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getAddresses(user.id)
      .then((list) => {
        setAddresses(list);
        setAddressIdState((list.find((a) => a.id === chosen?.id) || list.find((a) => a.is_default) || list[0])?.id ?? null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const address = addresses.find((a) => a.id === addressId);
  const country = normalizeCountry(address?.country);
  const cfg = address ? countryCfg(settings, country) : null;
  const methods = cfg?.payments || [];
  const payWith = methods.includes(method) ? method : methods[0] || null;
  const missingPhone = address && needsLandmark(country) && !address.phone;
  const subtotal = cart.reduce((n, i) => n + effectivePrice(i.products) * Number(i.quantity || 0), 0);
  const due = cfg && cfg.currency !== "USD" ? formatLocal(localAmount(cfg, quote(settings, subtotal, address).total), cfg.currency, i18n.language) : null;

  async function handleCod() {
    setProcessing(true);
    setError("");
    try {
      const items = cart.map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity || 0) }));
      const res = await axios.post(`${API_URL}/orders/cod`, { items, address_id: address.id }, { headers: await authHeaders() });
      await reloadCart();
      toast.success(t("checkout.codPlaced"));
      navigate(`/orders/${res.data.order_id}`);
    } catch (err) {
      setError(apiError(err, t));
      setProcessing(false);
    }
  }

  async function handleCheckout() {
    setProcessing(true);
    setError("");
    try {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        name: item.products?.name,
        price: effectivePrice(item.products),
        quantity: Number(item.quantity || 0),
      }));

      if (items.some((i) => !i.name || !(i.price > 0) || !(i.quantity > 0))) {
        throw new Error(t("checkout.invalidItem"));
      }

      const res = await axios.post(
        `${API_URL}/create-checkout-session`,
        { items, shipping_address: formatAddress(address), address_id: address?.id, address: address ? { country: address.country, state: address.state, city: address.city, postal_code: address.postal_code } : null },
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
                  <p className="text-cyan-400 font-bold m-0">{money(effectivePrice(p) * qty)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${card} p-6 h-fit`}>
          <OrderSummary cart={cart} address={address} />

          {error && <div className="mt-6 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}

          {address && !cfg && (
            <div className="mt-6 flex gap-2 bg-yellow-900/30 border border-yellow-700 text-yellow-200 p-4 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" /> {t("checkout.notDelivered", { country: countryName(country, i18n.language) })}
            </div>
          )}

          {cfg && methods.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-bold m-0">{t("checkout.paymentMethod")}</h3>
              {methods.map((m) => (
                <label key={m} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${payWith === m ? "border-cyan-500" : "border-zinc-800"}`}>
                  <input type="radio" name="pay" className="mt-1" checked={payWith === m} onChange={() => setMethod(m)} />
                  <span>
                    <span className="font-semibold flex items-center gap-2">
                      {m === "card" ? <CreditCard className="w-4 h-4 text-cyan-400" /> : <Banknote className="w-4 h-4 text-green-400" />}
                      {t(`checkout.method.${m}`)}
                    </span>
                    <span className="text-gray-400 text-sm block">{t(`checkout.methodHint.${m}`)}</span>
                  </span>
                </label>
              ))}
              {isLocalDelivery(settings, address) && <p className="text-green-400 text-sm m-0">🛵 {t("checkout.localDelivery")}</p>}
            </div>
          )}

          {payWith === "cod" && due && (
            <p className="mt-4 mb-0 text-lg">💵 {t("checkout.toPayOnDelivery")}: <strong className="text-green-400">{due}</strong></p>
          )}
          {missingPhone && <p className="mt-4 mb-0 text-yellow-300 text-sm">{t("checkout.phoneNeeded")}</p>}

          <button
            onClick={payWith === "cod" ? handleCod : handleCheckout}
            disabled={processing || !address || !cfg || !payWith || (payWith === "cod" && missingPhone)}
            className={`${btnPrimary} w-full mt-6 py-4`}
          >
            {processing ? t("checkout.redirecting") : payWith === "cod" ? t("checkout.placeOrder") : t("checkout.pay")}
          </button>
        </div>
      </div>
    </Page>
  );
}
