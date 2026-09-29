import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, MapPin, ExternalLink } from "lucide-react";
import Page, { card } from "@/components/Page";
import { StatusBadge, StatusTimeline } from "@/components/Orders/OrderStatus";
import { getOrder, apiError } from "@/api/account";
import { formatUSD, carrierName, trackingUrl } from "../../shared/settings";

export default function OrderDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrder(id).then(setOrder).catch((err) => setError(apiError(err, t)));
  }, [id, t]);

  const usd = (n) => formatUSD(n, i18n.language);

  return (
    <Page title={order ? t("orders.order", { id: order.id }) : t("orders.title")} width="max-w-3xl" back="/orders" backLabel={t("orders.title")}>
      {error && <p className="text-red-400">{error}</p>}
      {!order && !error && <p className="text-gray-400">{t("common.loading")}</p>}

      {order && (
        <div className="space-y-6">
          <div className={`${card} p-6`}>
            <div className="flex flex-wrap justify-between gap-3 mb-6">
              <span className="text-gray-400">{t("orders.placedOn", { date: new Date(order.created_at).toLocaleString(i18n.language) })}</span>
              <StatusBadge status={order.status} />
            </div>
            <h2 className="text-lg font-bold mb-4">{t("orders.tracking")}</h2>
            <StatusTimeline status={order.status} />
            <p className="mt-6 mb-0 flex items-center gap-2 text-gray-400">
              <Truck className="w-5 h-5 text-cyan-400" />
              {t("orders.trackingNumber")}:{" "}
              <span className="text-white font-mono">{order.tracking_number || t("orders.noTracking")}</span>
              {order.carrier && <span className="text-gray-400">· {carrierName(order.carrier)}</span>}
            </p>
            {trackingUrl(order.carrier, order.tracking_number) && (
              <a href={trackingUrl(order.carrier, order.tracking_number)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-5 py-3 rounded-lg no-underline">
                <ExternalLink className="w-4 h-4" /> {t("orders.trackPackage")}
              </a>
            )}
          </div>

          {order.shipping_address && (
            <div className={`${card} p-6`}>
              <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" /> {t("checkout.shipTo")}</h2>
              <p className="text-gray-400 mb-0">{order.shipping_address}</p>
            </div>
          )}

          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold mb-4">{t("orders.items")}</h2>
            <ul className="list-none p-0 m-0 space-y-3">
              {(order.order_items || []).map((it) => (
                <li key={it.id} className="flex justify-between gap-4">
                  <Link to={`/product/${it.product_id}`} className="text-white hover:text-cyan-400 no-underline">
                    {it.product_name} × {it.quantity}
                  </Link>
                  <span>{usd(Number(it.price) * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-zinc-800 mt-4 pt-4 font-bold text-lg">
              <span>{t("orders.total")}</span>
              <span className="text-cyan-400">{usd(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
