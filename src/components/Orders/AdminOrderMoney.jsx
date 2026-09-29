import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RotateCcw, BadgeDollarSign } from "lucide-react";
import { btnPrimary, btnSecondary, btnDanger, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { formatUSD } from "../../../shared/settings";

/** Admin side: customer's cancel/return request + refund */
export default function AdminOrderMoney({ order, fields, canRefund, onChange }) {
  const { t, i18n } = useTranslation();
  const usd = (n) => formatUSD(n, i18n.language);
  const refunded = Number(order.refunded_amount || 0);
  const refundable = Math.max(0, Math.round((Number(order.total) - refunded) * 100) / 100);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(String(refundable));
  const [restock, setRestock] = useState(order.request_type === "cancel" || order.request_type === "return");
  const [cancel, setCancel] = useState(order.request_type === "cancel" || ["paid", "processing"].includes(order.status));
  const [busy, setBusy] = useState(false);

  if (!fields?.returns) {
    return <div className={`${card} p-6 text-yellow-400 text-sm`}>{t("returns.needSql")}</div>;
  }

  async function run(fn, ok) {
    setBusy(true);
    try {
      const o = await fn();
      onChange(o);
      toast.success(ok);
      return o;
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  function doRefund(value = amount) {
    const v = Number(value);
    if (!(v > 0)) return;
    if (!window.confirm(t("returns.refundConfirm", { amount: usd(v) }))) return;
    return run(() => adminApi.refund(order.id, { amount: v, restock, cancel }), t("returns.refundDone")).then((o) => {
      if (o) setAmount(String(Math.max(0, Math.round((Number(o.total) - Number(o.refunded_amount || 0)) * 100) / 100)));
    });
  }

  const pending = order.request_status === "pending";

  return (
    <>
      {order.request_type && (
        <div className={`${card} p-6 space-y-3 ${pending ? "border-yellow-500/60" : ""}`}>
          <h2 className="text-lg font-bold flex items-center gap-2 m-0"><RotateCcw className="w-5 h-5 text-yellow-400" /> {t("returns.requestTitle")}</h2>
          <p className="font-semibold m-0">{t(`returns.status.${order.request_type}.${order.request_status}`)}</p>
          {order.requested_at && <p className="text-gray-400 text-sm m-0">{new Date(order.requested_at).toLocaleString(i18n.language)}</p>}
          {order.request_reason && <p className="m-0"><span className="text-gray-400">{t("returns.reason")} :</span> {order.request_reason}</p>}
          {order.request_message && <p className="text-gray-400 text-sm m-0 whitespace-pre-line">{t("returns.teamMessage")} : {order.request_message}</p>}
          {pending && (
            <>
              <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("returns.messagePlaceholder")} className={inputClass} />
              <div className="flex flex-wrap gap-3">
                {canRefund && order.request_type === "cancel" && refundable > 0 && (
                  <button className={btnPrimary} disabled={busy} onClick={() => doRefund(refundable)}>{t("returns.approveRefund")}</button>
                )}
                <button className={order.request_type === "cancel" && canRefund ? btnSecondary : btnPrimary} disabled={busy}
                  onClick={() => run(() => adminApi.decide(order.id, "approved", message), t("common.saved"))}>
                  {t("returns.approve")}
                </button>
                <button className={btnDanger} disabled={busy} onClick={() => run(() => adminApi.decide(order.id, "rejected", message), t("common.saved"))}>
                  {t("returns.reject")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {canRefund && order.stripe_session_id && (
        <div className={`${card} p-6 space-y-3`}>
          <h2 className="text-lg font-bold flex items-center gap-2 m-0"><BadgeDollarSign className="w-5 h-5 text-cyan-400" /> {t("returns.refundTitle")}</h2>
          {refunded > 0 && <p className="text-green-400 text-sm m-0">{refundable > 0 ? t("returns.alreadyRefunded", { amount: usd(refunded) }) : t("returns.fullyRefunded")}</p>}
          {refundable > 0 && (
            <>
              <label className="block text-sm text-gray-400">
                {t("returns.refundAmount")}
                <input type="number" min="0.01" step="0.01" max={refundable} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> {t("returns.restock")}
              </label>
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={cancel} onChange={(e) => setCancel(e.target.checked)} /> {t("returns.cancelOrder")}
                </label>
              )}
              <button className={btnDanger} disabled={busy || !(Number(amount) > 0)} onClick={() => doRefund()}>
                {t("returns.refundBtn", { amount: usd(Number(amount) || 0) })}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
