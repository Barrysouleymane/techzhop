import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Bike, Banknote, CreditCard, Image as ImageIcon, Map as MapIcon } from "lucide-react";
import { btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { orderAmountText, countryName, mapsUrl } from "../../../shared/settings";

/** Admin side: country, payment (card / pay on delivery) and driver */
export default function AdminDelivery({ order, fields, onChange }) {
  const { t, i18n } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (fields?.delivery) adminApi.drivers().then(setDrivers).catch(() => {});
  }, [fields?.delivery]);

  if (!fields?.delivery) {
    return <div className={`${card} p-6 text-yellow-400 text-sm`}>{t("delivery.needSql")}</div>;
  }

  async function save(body, ok) {
    setBusy(true);
    try {
      onChange(await adminApi.updateOrder(order.id, body));
      toast.success(ok || t("common.saved"));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  const cod = order.payment_method === "cod";
  const paid = ["paid", "collected"].includes(order.payment_status);
  const map = mapsUrl(order);
  const countryDrivers = drivers.filter((d) => !d.country || !order.country || d.country === order.country);

  return (
    <div className={`${card} p-6 space-y-4`}>
      <h2 className="text-lg font-bold flex items-center gap-2 m-0"><Bike className="w-5 h-5 text-cyan-400" /> {t("delivery.title")}</h2>

      <div className="text-sm space-y-1">
        {order.country && <p className="m-0"><span className="text-gray-400">{t("addresses.country")}:</span> {countryName(order.country, i18n.language)}</p>}
        <p className="m-0"><span className="text-gray-400">{t("delivery.mode")}:</span> {t(`delivery.modes.${order.delivery_mode || "carrier"}`)}</p>
        <p className="m-0 flex items-center gap-2">
          {cod ? <Banknote className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-cyan-400" />}
          {t(`checkout.method.${cod ? "cod" : "card"}`)} ·{" "}
          <span className={paid ? "text-green-400" : "text-yellow-300"}>{paid ? t("delivery.paid") : t("delivery.toPay", { amount: orderAmountText(order, i18n.language) })}</span>
        </p>
        {order.collected_method && <p className="m-0 text-gray-400">{t(`delivery.collected.${order.collected_method}`)}</p>}
        {order.delivery_code && <p className="m-0"><span className="text-gray-400">{t("delivery.code")}:</span> <span className="font-mono font-bold">{order.delivery_code}</span></p>}
      </div>

      {map && (
        <a href={map} target="_blank" rel="noreferrer" className={`${btnSecondary} w-full justify-center`}>
          <MapIcon className="w-4 h-4" /> {t("delivery.openMap")}
        </a>
      )}

      <label className="block text-sm">
        <span className="text-gray-400">{t("delivery.assignDriver")}</span>
        <select
          value={order.driver_id || ""}
          disabled={busy}
          onChange={(e) => save({ driver_id: e.target.value || null }, t("delivery.assigned"))}
          className={`${inputClass} mt-1`}
        >
          <option value="">{t("delivery.noDriver")}</option>
          {countryDrivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name || d.phone || d.id.slice(0, 8)}{d.country ? ` · ${d.country}` : ""}</option>
          ))}
        </select>
        {drivers.length === 0 && <span className="text-gray-500 text-xs block mt-1">{t("delivery.noDrivers")}</span>}
      </label>

      {order.delivery_status && (
        <p className="m-0 text-sm"><span className="text-gray-400">{t("delivery.status")}:</span> <strong>{t(`delivery.steps.${order.delivery_status}`)}</strong></p>
      )}
      {order.delivery_note && <p className="m-0 text-sm text-yellow-300">{order.delivery_note}</p>}
      {order.delivery_photo_url && (
        <a href={order.delivery_photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-cyan-400 text-sm no-underline">
          <ImageIcon className="w-4 h-4" /> {t("delivery.photo")}
        </a>
      )}

      {cod && !paid && (
        <button className={`${btnPrimary} w-full`} disabled={busy} onClick={() => save({ payment_status: "collected" })}>
          {t("delivery.markCollected")}
        </button>
      )}
    </div>
  );
}
