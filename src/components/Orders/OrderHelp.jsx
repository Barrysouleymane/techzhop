import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LifeBuoy, RotateCcw, XCircle, BadgeDollarSign } from "lucide-react";
import { btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { requestOrderHelp, apiError } from "@/api/account";
import { formatUSD } from "../../../shared/settings";

const REASONS = ["changedMind", "damaged", "wrongItem", "late", "other"];

/** Customer side: cancel / return request + its status + refunds */
export default function OrderHelp({ order, onChange }) {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const refunded = Number(order.refunded_amount || 0);
  const hasRequest = order.request_type && order.request_status;
  if (!order.can_cancel && !order.can_return && !hasRequest && !refunded) return null;

  async function send() {
    if (!reason) return;
    setSending(true);
    try {
      const text = [t(`returns.reasons.${reason}`), details.trim()].filter(Boolean).join(" — ");
      onChange(await requestOrderHelp(order.id, type, text));
      toast.success(t("returns.sent"));
      setType(null);
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setSending(false);
    }
  }

  const color = { pending: "text-yellow-400", approved: "text-green-400", rejected: "text-red-400" }[order.request_status] || "";

  return (
    <div className={`${card} p-6 space-y-4`}>
      <h2 className="text-lg font-bold flex items-center gap-2 m-0"><LifeBuoy className="w-5 h-5 text-cyan-400" /> {t("returns.needHelp")}</h2>

      {hasRequest && (
        <div className="space-y-2">
          <p className={`font-semibold m-0 ${color}`}>{t(`returns.status.${order.request_type}.${order.request_status}`)}</p>
          {order.request_reason && <p className="text-gray-400 text-sm m-0">{t("returns.reason")} : {order.request_reason}</p>}
          {order.request_message && (
            <div className="rounded-lg bg-zinc-800/60 p-3 text-sm">
              <div className="font-semibold mb-1">{t("returns.teamMessage")}</div>
              <div className="text-gray-300 whitespace-pre-line">{order.request_message}</div>
            </div>
          )}
        </div>
      )}

      {refunded > 0 && (
        <p className="flex items-center gap-2 text-green-400 font-semibold m-0">
          <BadgeDollarSign className="w-5 h-5" /> {t("returns.refunded", { amount: formatUSD(refunded, i18n.language) })}
        </p>
      )}

      {!type && (order.can_cancel || order.can_return) && (
        <div className="flex flex-wrap items-center gap-3">
          {order.can_cancel && (
            <button className={btnSecondary} onClick={() => { setType("cancel"); setReason(""); setDetails(""); }}>
              <XCircle className="w-4 h-4" /> {t("returns.cancel")}
            </button>
          )}
          {order.can_return && (
            <>
              <button className={btnSecondary} onClick={() => { setType("return"); setReason(""); setDetails(""); }}>
                <RotateCcw className="w-4 h-4" /> {t("returns.return")}
              </button>
              <span className="text-gray-400 text-sm">
                {t("returns.returnUntil", { date: new Date(order.return_deadline).toLocaleDateString(i18n.language) })}
              </span>
            </>
          )}
        </div>
      )}

      {type && (
        <div className="space-y-3">
          <h3 className="font-bold m-0">{t(`returns.${type}`)}</h3>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`px-3 py-2 rounded-full border text-sm cursor-pointer ${reason === r ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-zinc-700 bg-transparent text-gray-300"}`}
              >
                {t(`returns.reasons.${r}`)}
              </button>
            ))}
          </div>
          <textarea rows={3} maxLength={800} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("returns.details")} className={inputClass} />
          {type === "return" && <p className="text-gray-400 text-sm m-0">{t("returns.policy", { days: order.return_days || 14 })}</p>}
          <div className="flex gap-3">
            <button className={btnPrimary} disabled={!reason || sending} onClick={send}>{t("returns.send")}</button>
            <button className={btnSecondary} onClick={() => setType(null)}>{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
