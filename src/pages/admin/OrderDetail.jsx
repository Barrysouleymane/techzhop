import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, CreditCard, Truck, ExternalLink, StickyNote } from "lucide-react";
import Page, { Field, btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { StatusBadge, StatusTimeline } from "@/components/Orders/OrderStatus";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { ORDER_STATUSES, CARRIERS, formatUSD, trackingUrl } from "../../../shared/settings";

export default function AdminOrderDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tracking, setTracking] = useState({ carrier: "", tracking_number: "", admin_note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .order(id)
      .then((d) => {
        setData(d);
        setTracking({
          carrier: d.order.carrier || "",
          tracking_number: d.order.tracking_number || "",
          admin_note: d.order.admin_note || "",
        });
      })
      .catch((err) => toast.error(apiError(err, t)));
  }, [id, t]);

  async function save(fields) {
    setSaving(true);
    try {
      const order = await adminApi.updateOrder(id, fields);
      setData((d) => ({ ...d, order: { ...d.order, ...order } }));
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <Page><p className="text-gray-400">{t("common.loading")}</p></Page>;

  const { order, customer, payment, fields } = data;
  const usd = (n) => formatUSD(n, i18n.language);
  const link = trackingUrl(order.carrier, order.tracking_number);
  const next = { paid: "processing", processing: "shipped", shipped: "delivered" }[order.status];

  return (
    <Page title={t("orders.order", { id: order.id })} width="max-w-5xl" back="/admin" backLabel={t("admin.title")}
      actions={<StatusBadge status={order.status} />}>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* STATUS */}
          <div className={`${card} p-6`}>
            <p className="text-gray-400 mt-0">{t("orders.placedOn", { date: new Date(order.created_at).toLocaleString(i18n.language) })}</p>
            <StatusTimeline status={order.status} />
            <div className="flex flex-wrap gap-3 mt-6">
              {next && (
                <button onClick={() => save({ status: next })} disabled={saving} className={btnPrimary}>
                  {t("admin.markAs", { status: t(`orders.status.${next}`) })}
                </button>
              )}
              <select value={order.status} onChange={(e) => save({ status: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.status.${s}`)}</option>)}
              </select>
            </div>
          </div>

          {/* TRACKING */}
          <div className={`${card} p-6 space-y-4`}>
            <h2 className="text-lg font-bold flex items-center gap-2 m-0"><Truck className="w-5 h-5 text-cyan-400" /> {t("orders.tracking")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("admin.carrier")}>
                <select value={tracking.carrier} onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })} className={inputClass} disabled={!fields.carrier}>
                  <option value="">{t("admin.chooseCarrier")}</option>
                  {CARRIERS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={t("orders.trackingNumber")}>
                <input value={tracking.tracking_number} onChange={(e) => setTracking({ ...tracking, tracking_number: e.target.value })} placeholder="1Z999AA10123456784" className={inputClass} />
              </Field>
            </div>
            {!fields.carrier && <p className="text-yellow-400 text-sm m-0">{t("admin.needSql")}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                disabled={saving}
                className={btnPrimary}
                onClick={() =>
                  save({
                    tracking_number: tracking.tracking_number,
                    ...(fields.carrier ? { carrier: tracking.carrier } : {}),
                    ...(order.status === "paid" || order.status === "processing" ? (tracking.tracking_number ? { status: "shipped" } : {}) : {}),
                  })
                }
              >
                {t("admin.saveTracking")}
              </button>
              {link && (
                <a href={link} target="_blank" rel="noreferrer" className={btnSecondary}>
                  <ExternalLink className="w-4 h-4" /> {t("orders.trackPackage")}
                </a>
              )}
            </div>
          </div>

          {/* ITEMS */}
          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold mb-4">{t("orders.items")}</h2>
            <ul className="list-none p-0 m-0 space-y-3">
              {(order.order_items || []).map((it) => (
                <li key={it.id} className="flex items-center gap-4">
                  <div className="bg-white w-14 h-14 rounded-lg flex items-center justify-center shrink-0">
                    {it.image && <img src={it.image} alt="" className="max-h-full max-w-full object-contain" />}
                  </div>
                  <div className="flex-1">
                    {it.product_id ? (
                      <Link to={`/admin/products/${it.product_id}`} className="text-white hover:text-cyan-400 no-underline font-semibold">{it.product_name}</Link>
                    ) : (
                      <span className="font-semibold">{it.product_name}</span>
                    )}
                    <div className="text-gray-400 text-sm">{usd(it.price)} × {it.quantity}</div>
                  </div>
                  <span className="font-semibold">{usd(Number(it.price) * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-zinc-800 mt-4 pt-4 font-bold text-lg">
              <span>{t("orders.total")}</span>
              <span className="text-cyan-400">{usd(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* CUSTOMER */}
          <div className={`${card} p-6 space-y-3`}>
            <h2 className="text-lg font-bold m-0">{t("admin.customer")}</h2>
            <p className="flex items-center gap-2 m-0"><User className="w-4 h-4 text-cyan-400" /> {customer?.name || t("admin.guest")}</p>
            {customer?.email && <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-white hover:text-cyan-400 no-underline break-all"><Mail className="w-4 h-4 text-cyan-400 shrink-0" /> {customer.email}</a>}
            {customer?.phone && <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-white hover:text-cyan-400 no-underline"><Phone className="w-4 h-4 text-cyan-400" /> {customer.phone}</a>}
          </div>

          {/* ADDRESS */}
          {order.shipping_address && (
            <div className={`${card} p-6`}>
              <h2 className="text-lg font-bold flex items-center gap-2 mt-0"><MapPin className="w-5 h-5 text-cyan-400" /> {t("checkout.shipTo")}</h2>
              <p className="text-gray-300 m-0">{order.shipping_address}</p>
            </div>
          )}

          {/* PAYMENT */}
          {payment && (
            <div className={`${card} p-6 space-y-2`}>
              <h2 className="text-lg font-bold flex items-center gap-2 m-0"><CreditCard className="w-5 h-5 text-cyan-400" /> {t("admin.payment")}</h2>
              <p className="m-0">{usd(payment.amount)} · <span className="text-green-400">{payment.status}</span></p>
              {payment.email && <p className="text-gray-400 text-sm m-0 break-all">{payment.email}</p>}
              {payment.dashboard_url && (
                <a href={payment.dashboard_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 no-underline text-sm">
                  {t("admin.viewInStripe")} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* NOTE */}
          {fields.note && (
            <div className={`${card} p-6 space-y-3`}>
              <h2 className="text-lg font-bold flex items-center gap-2 m-0"><StickyNote className="w-5 h-5 text-cyan-400" /> {t("admin.internalNote")}</h2>
              <textarea rows={4} value={tracking.admin_note} onChange={(e) => setTracking({ ...tracking, admin_note: e.target.value })} placeholder={t("admin.notePlaceholder")} className={inputClass} />
              <button onClick={() => save({ admin_note: tracking.admin_note })} disabled={saving} className={btnSecondary}>{t("common.save")}</button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
