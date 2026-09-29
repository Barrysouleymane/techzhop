import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Page, { btnPrimary, btnSecondary, card } from "@/components/Page";
import { API_URL } from "@/config/constants";
import { formatUSD } from "../../shared/settings";
import useCartStore from "@/store/cartStore";

export default function Success() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadCart = useCartStore((s) => s.load);

  useEffect(() => {
    if (!sessionId) {
      setError(t("success.notFound"));
      setLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/checkout-session/${sessionId}`)
      .then((res) => setSession(res.data))
      .catch(() => setError(t("success.notFound")))
      .finally(() => {
        setLoading(false);
        loadCart();
      });
  }, [sessionId, t, loadCart]);

  if (loading) return <Page><div className="text-center py-20"><div className="text-5xl mb-6">⏳</div><h1 className="text-2xl font-bold">{t("success.loading")}</h1></div></Page>;

  return (
    <Page width="max-w-3xl">
      <div className="text-center">
        <div className="text-7xl mb-6">{error ? "⚠️" : "✅"}</div>
        <h1 className="text-4xl font-bold mb-4">{t("success.title")}</h1>
        <p className="text-gray-400 text-lg">{error || t("success.thanks")}</p>
      </div>

      {session && (
        <div className={`${card} mt-10 p-6 space-y-4`}>
          <h2 className="text-2xl font-bold">{t("success.details")}</h2>
          <Row label={t("success.paymentStatus")} value={<span className="text-green-400 font-bold">{session.payment_status}</span>} />
          <Row label={t("cart.total")} value={<span className="text-cyan-400 font-bold text-xl">{formatUSD((session.amount_total || 0) / 100, i18n.language)}</span>} />
          <Row label={t("success.email")} value={session.customer_details?.email || "—"} />
          <Row label={t("success.orderId")} value={<span className="text-sm break-all">{session.id}</span>} />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <Link to="/products" className={btnPrimary}>{t("cart.continueShopping")}</Link>
        <Link to="/orders" className={btnSecondary}>{t("success.myOrders")}</Link>
      </div>
    </Page>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-6 border-b border-zinc-800 pb-3 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
