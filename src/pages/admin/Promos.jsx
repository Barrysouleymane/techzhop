import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tag } from "lucide-react";
import { Field, btnPrimary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import { formatUSD } from "../../../shared/settings";

const EMPTY = { code: "", percent_off: "", amount_off: "", expires_at: "", max_redemptions: "" };

export default function Promos() {
  const { t, i18n } = useTranslation();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () => adminApi.promos().then(setList).catch((err) => { toast.error(apiError(err, t)); setList([]); });
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createPromo(form);
      setForm(EMPTY);
      toast.success(t("common.saved"));
      load();
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form onSubmit={create} className={`${card} p-6 space-y-3 h-fit`}>
        <h2 className="text-xl font-bold m-0">{t("admin.newPromo")}</h2>
        <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className={`${inputClass} font-mono uppercase`} />
        <div className="grid grid-cols-2 gap-3 items-end">
          <Field label={t("admin.percentOff")}><input type="number" min="1" max="100" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value, amount_off: "" })} className={inputClass} /></Field>
          <Field label={t("admin.amountOff")}><input type="number" min="1" step="0.01" value={form.amount_off} onChange={(e) => setForm({ ...form, amount_off: e.target.value, percent_off: "" })} className={inputClass} /></Field>
        </div>
        <Field label={t("admin.expires")}><input type="date" value={form.expires_at} onChange={set("expires_at")} className={inputClass} /></Field>
        <Field label={t("admin.maxUses")}><input type="number" min="1" value={form.max_redemptions} onChange={set("max_redemptions")} className={inputClass} /></Field>
        <button disabled={busy} className={`${btnPrimary} w-full`}>{t("admin.create")}</button>
      </form>

      <div className={`lg:col-span-2 ${card} divide-y divide-zinc-800 h-fit`}>
        {list === null && <p className="p-6 text-gray-400 m-0">{t("common.loading")}</p>}
        {list?.length === 0 && <p className="p-6 text-gray-400 m-0">{t("admin.noPromos")}</p>}
        {list?.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
            <Tag className="w-5 h-5 text-cyan-400" />
            <div className="flex-1 min-w-[160px]">
              <div className={`font-mono font-bold ${p.active ? "" : "line-through text-gray-500"}`}>{p.code}</div>
              <div className="text-gray-400 text-sm">
                {p.percent_off ? `-${p.percent_off}%` : `-${formatUSD(p.amount_off, i18n.language)}`}
                {" · "}{t("admin.used", { count: p.times_redeemed })}
                {p.max_redemptions ? ` / ${p.max_redemptions}` : ""}
                {p.expires_at ? ` · ${new Date(p.expires_at).toLocaleDateString(i18n.language)}` : ""}
              </div>
            </div>
            <button
              onClick={async () => {
                await adminApi.setPromoActive(p.id, !p.active).catch((err) => toast.error(apiError(err, t)));
                load();
              }}
              className={`text-sm ${p.active ? "text-red-400" : "text-green-400"}`}
            >
              {p.active ? t("admin.deactivate") : t("admin.activate")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
