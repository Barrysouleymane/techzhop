import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, ChevronRight } from "lucide-react";
import Page, { btnPrimary, card } from "@/components/Page";
import { StatusBadge } from "@/components/Orders/OrderStatus";
import { getMyOrders, apiError } from "@/api/account";
import { formatUSD } from "../../shared/settings";

export default function Orders() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(apiError(err, t)))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <Page title={t("orders.title")} back="/account" backLabel={t("account.title")}>
      {loading && <p className="text-gray-400">{t("common.loading")}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-14 h-14 mx-auto mb-4" />
          <p>{t("orders.empty")}</p>
          <Link to="/products" className={btnPrimary}>{t("orders.startShopping")}</Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => {
          const count = (o.order_items || []).reduce((n, i) => n + i.quantity, 0);
          return (
            <Link key={o.id} to={`/orders/${o.id}`} className={`${card} p-5 flex items-center gap-4 hover:border-cyan-500 transition no-underline text-white`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="text-lg">{t("orders.order", { id: o.id })}</strong>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-gray-400 text-sm mt-1 mb-0">
                  {t("orders.placedOn", { date: new Date(o.created_at).toLocaleDateString(i18n.language) })} · {t("orders.items")}: {count}
                </p>
              </div>
              <span className="text-cyan-400 font-bold">{formatUSD(o.total, i18n.language)}</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
