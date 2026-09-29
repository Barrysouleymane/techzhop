import { useTranslation } from "react-i18next";
import { Tag } from "lucide-react";
import useMoney, { useCurrency } from "@/hooks/useMoney";
import useShopStore from "@/store/shopStore";
import { effectivePrice, quote, formatUSD } from "../../../shared/settings";

/** Subtotal / shipping / tax / total for a cart and an address */
export default function OrderSummary({ cart, address, children }) {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const currency = useCurrency();
  const settings = useShopStore((s) => s.settings);

  const subtotal = cart.reduce((n, i) => n + effectivePrice(i.products) * Number(i.quantity || 0), 0);
  const q = quote(settings, subtotal, address);
  const items = cart.reduce((n, i) => n + Number(i.quantity || 0), 0);

  const row = (label, value, extra = "") => (
    <div className={`flex justify-between mb-3 ${extra}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("cart.summary")}</h2>
      {row(t("cart.items"), items)}
      {row(t("cart.subtotalLabel"), money(q.subtotal))}
      {row(t("cart.shipping"), q.shipping === 0 ? <span className="text-green-400">{t("cart.free")}</span> : money(q.shipping))}
      {q.tax > 0 && row(`${t("cart.tax")} (${q.taxRate}%)`, money(q.tax))}
      <div className="border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold">
        <span>{t("cart.total")}</span>
        <span className="text-cyan-400">{money(q.total)}</span>
      </div>
      {currency !== "USD" && (
        <p className="text-gray-400 text-sm mt-2 mb-0">{t("checkout.chargedInUsd", { amount: formatUSD(q.total, i18n.language) })}</p>
      )}
      <p className="text-gray-500 text-xs mt-3 mb-0">{t("cart.estimateNote")}</p>
      <p className="text-gray-400 text-sm mt-2 mb-0 flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-400" /> {t("cart.promoNote")}</p>
      {children}
    </div>
  );
}
