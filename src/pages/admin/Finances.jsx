import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Landmark, Wallet, ExternalLink, Banknote, RefreshCw, ShieldCheck, Phone } from "lucide-react";
import { btnPrimary, btnSecondary, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { formatLocal, formatUSD, flag, countryName } from "../../../shared/settings";

export default function Finances() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const L = i18n.language;
  const money = (a, c) => formatLocal(a, c, L);

  const load = useCallback(() => adminApi.finances().then(setData).catch((err) => toast.error(apiError(err, t))), [t]);
  useEffect(() => { load(); }, [load]);

  async function remit(d) {
    if (!window.confirm(t("finances.remitConfirm", { name: d.name || d.phone || "", amount: money(d.amount, d.currency) }))) return;
    setBusy(true);
    try {
      await adminApi.remitCash(d.driver_id, d.currency);
      toast.success(t("finances.remitted"));
      await load();
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-gray-400">{t("common.loading")}</p>;
  const st = data.stripe || {};
  const sales = data.sales || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-400 text-sm m-0 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" /> {t("finances.safe")}</p>
        <button onClick={load} className={btnSecondary}><RefreshCw className="w-4 h-4" /> {t("driver.refresh")}</button>
      </div>

      {/* STRIPE BALANCE */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <div className="text-gray-400 text-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> {t("finances.available")}</div>
          <div className="text-2xl font-bold mt-2">{(st.available || []).map((b) => money(b.amount, b.currency)).join(" · ") || "—"}</div>
        </div>
        <div className={`${card} p-5`}>
          <div className="text-gray-400 text-sm">{t("finances.pending")}</div>
          <div className="text-2xl font-bold mt-2">{(st.pending || []).map((b) => money(b.amount, b.currency)).join(" · ") || "—"}</div>
          <div className="text-gray-500 text-xs mt-1">{t("finances.pendingHint")}</div>
        </div>
        <div className={`${card} p-5`}>
          <div className="text-gray-400 text-sm">{t("finances.sales30", { days: sales.days || 30 })}</div>
          <div className="text-2xl font-bold mt-2">{formatUSD(sales.total_usd || 0, L)}</div>
          <div className="text-gray-500 text-xs mt-1">
            {t("finances.ordersCount", { count: sales.count || 0 })}
            {sales.refunded_usd > 0 ? ` · ${t("finances.refunded", { amount: formatUSD(sales.refunded_usd, L) })}` : ""}
          </div>
        </div>
      </div>

      {st.mode === "test" && <p className="text-yellow-300 text-sm m-0">🧪 {t("finances.testMode")}</p>}
      {st.error && <p className="text-red-400 text-sm m-0">Stripe : {st.error}</p>}

      {/* BANK / PAYOUTS */}
      <div className={`${card} p-6 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold m-0 flex items-center gap-2"><Landmark className="w-5 h-5 text-cyan-400" /> {t("finances.bankTitle")}</h2>
          <a href={st.links?.payouts} target="_blank" rel="noreferrer" className={btnPrimary}>
            {t("finances.manageBank")} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-gray-400 text-sm m-0">
          {(st.banks || []).length === 0 ? `⚠️ ${t("finances.noBank")}` : st.payouts_enabled === false ? `⏳ ${t("finances.notActivated")}` : t("finances.bankHint")}
          {st.schedule ? ` · ${t("finances.schedule")}: ${t(`finances.intervals.${st.schedule}`, st.schedule)}` : ""}
        </p>
        {(st.banks || []).map((b, i) => (
          <p key={i} className="m-0 flex items-center gap-2 font-semibold">🏦 {b.name || "Bank"} •••• {b.last4} {b.currency && <span className="text-gray-400 text-sm">{b.currency}</span>}</p>
        ))}
        {(st.payouts || []).length === 0 ? (
          <p className="text-gray-500 m-0">{t("finances.noPayouts")}</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {st.payouts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-semibold">{money(p.amount, p.currency)}</div>
                  <div className="text-gray-400 text-sm">
                    {new Date(p.arrival_date).toLocaleDateString(L)}
                    {p.bank ? ` · ${p.bank.name || ""} •••• ${p.bank.last4 || ""}` : ""}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === "paid" ? "bg-green-500/20 text-green-300" : p.status === "failed" ? "bg-red-500/20 text-red-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                  {t(`finances.payoutStatus.${p.status}`, p.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CASH ON DELIVERY */}
      <div className={`${card} p-6 space-y-4`}>
        <h2 className="text-xl font-bold m-0 flex items-center gap-2"><Banknote className="w-5 h-5 text-green-400" /> {t("finances.cashTitle")}</h2>
        <p className="text-gray-400 text-sm m-0">{t("finances.cashHint")}</p>
        {Object.keys(sales.cod_pending || {}).length > 0 && (
          <p className="m-0 text-sm">{t("finances.codPending")}: <strong>{Object.entries(sales.cod_pending).map(([c, a]) => money(a, c)).join(" · ")}</strong></p>
        )}
        {!data.remit_enabled && <p className="text-yellow-300 text-sm m-0">{t("finances.needSql")}</p>}
        {data.drivers.length === 0 ? (
          <p className="text-gray-500 m-0">{t("finances.noCash")}</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {data.drivers.map((d) => (
              <div key={`${d.driver_id}-${d.currency}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-semibold">🛵 {d.name || t("delivery.driver")}</div>
                  <div className="text-gray-400 text-sm">
                    {t("finances.ordersCount", { count: d.count })}
                    {d.mobile_money > 0 ? ` · ${t("delivery.collected.mobile_money")}: ${money(d.mobile_money, d.currency)}` : ""}
                    {d.phone && <a href={`tel:${d.phone}`} className="ml-2 text-cyan-400 no-underline inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</a>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-yellow-300">{money(d.amount, d.currency)}</span>
                  {data.remit_enabled && (
                    <button disabled={busy} onClick={() => remit(d)} className={btnSecondary}>{t("finances.remit")}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BY COUNTRY */}
      {Object.keys(sales.byCountry || {}).length > 0 && (
        <div className={`${card} p-6`}>
          <h2 className="text-xl font-bold mt-0 mb-4">{t("finances.byCountry")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(sales.byCountry).map(([c, v]) => (
              <div key={c} className="flex justify-between rounded-lg border border-zinc-800 p-3">
                <span>{flag(c)} {countryName(c, L)} · {t("finances.ordersCount", { count: v.count })}</span>
                <strong>{formatUSD(v.total_usd, L)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
