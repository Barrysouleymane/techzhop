import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Field, btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import useShopStore from "@/store/shopStore";

export default function StoreSettings() {
  const { t } = useTranslation();
  const reloadShop = useShopStore((s) => s.load);
  const [v, setV] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.settings().then(setV).catch((err) => toast.error(apiError(err, t)));
  }, [t]);

  if (!v) return <p className="text-gray-400">{t("common.loading")}</p>;

  const bar = { enabled: false, text: "", ends_at: null, link: "", ...(v.promo_bar || {}) };
  const setBar = (k, val) => setV({ ...v, promo_bar: { ...bar, [k]: val } });
  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const ship = (k) => (e) => setV({ ...v, shipping: { ...v.shipping, [k]: e.target.value } });
  const zones = v.shipping.zones || [];
  const rates = v.taxes.rates || [];
  const setZone = (i, k, val) => setV({ ...v, shipping: { ...v.shipping, zones: zones.map((z, n) => (n === i ? { ...z, [k]: val } : z)) } });
  const setRate = (i, k, val) => setV({ ...v, taxes: { ...v.taxes, rates: rates.map((r, n) => (n === i ? { ...r, [k]: val } : r)) } });

  async function save() {
    setSaving(true);
    try {
      setV(await adminApi.saveSettings(v));
      reloadShop(true);
      toast.success(t("admin.settingsSaved"));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  const small = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white w-full";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className={`${card} p-6 space-y-4`}>
        <h2 className="text-xl font-bold m-0">🚚 {t("admin.shippingTitle")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("admin.standardRate")}><input type="number" step="0.01" min="0" value={v.shipping.standard_rate} onChange={ship("standard_rate")} className={inputClass} /></Field>
          <Field label={t("admin.freeOver")}><input type="number" step="0.01" min="0" value={v.shipping.free_over} onChange={ship("free_over")} className={inputClass} /></Field>
        </div>
        <Field label={t("admin.deliveryDays")}>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" min="0" value={v.shipping.min_days} onChange={ship("min_days")} placeholder={t("admin.minDays")} className={inputClass} />
            <input type="number" min="0" value={v.shipping.max_days} onChange={ship("max_days")} placeholder={t("admin.maxDays")} className={inputClass} />
          </div>
        </Field>

        <h3 className="font-bold mb-0">{t("admin.zones")}</h3>
        {zones.map((z, i) => (
          <div key={i} className="flex gap-2">
            <input value={z.country} onChange={(e) => setZone(i, "country", e.target.value)} placeholder={t("admin.country")} className={small} />
            <input type="number" step="0.01" min="0" value={z.rate} onChange={(e) => setZone(i, "rate", e.target.value)} placeholder={t("admin.rate")} className={small} />
            <button onClick={() => setV({ ...v, shipping: { ...v.shipping, zones: zones.filter((_, n) => n !== i) } })} aria-label={t("admin.remove")} className="text-red-400 px-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, shipping: { ...v.shipping, zones: [...zones, { country: "", rate: "" }] } })} className={btnSecondary}>
          <Plus className="w-4 h-4" /> {t("admin.addZone")}
        </button>
      </div>

      <div className={`${card} p-6 space-y-4 h-fit`}>
        <h2 className="text-xl font-bold m-0">🧾 {t("admin.taxesTitle")}</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={!!v.taxes.enabled} onChange={(e) => setV({ ...v, taxes: { ...v.taxes, enabled: e.target.checked } })} />
          {t("admin.taxesEnabled")}
        </label>
        <p className="text-gray-400 text-sm m-0">{t("admin.taxHelp")}</p>
        {rates.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input value={r.country} onChange={(e) => setRate(i, "country", e.target.value)} placeholder={t("admin.country")} className={small} />
            <input value={r.state || ""} onChange={(e) => setRate(i, "state", e.target.value)} placeholder={t("admin.state")} className={small} />
            <input type="number" step="0.001" min="0" value={r.rate} onChange={(e) => setRate(i, "rate", e.target.value)} placeholder={t("admin.taxRate")} className={small} />
            <button onClick={() => setV({ ...v, taxes: { ...v.taxes, rates: rates.filter((_, n) => n !== i) } })} aria-label={t("admin.remove")} className="text-red-400 px-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, taxes: { ...v.taxes, rates: [...rates, { country: "US", state: "", rate: "" }] } })} className={btnSecondary}>
          <Plus className="w-4 h-4" /> {t("admin.addRate")}
        </button>
      </div>

      <div className={`${card} p-6 space-y-4 lg:col-span-2`}>
        <h2 className="text-xl font-bold m-0">📣 {t("admin.promoBarTitle")}</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={!!bar.enabled} onChange={(e) => setBar("enabled", e.target.checked)} />
          {t("admin.promoBarEnabled")}
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label={t("admin.promoBarText")}><input value={bar.text} maxLength={140} onChange={(e) => setBar("text", e.target.value)} className={inputClass} /></Field>
          <Field label={t("admin.promoBarEnds")}><input type="datetime-local" value={toLocal(bar.ends_at)} onChange={(e) => setBar("ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} /></Field>
          <Field label={t("admin.promoBarLink")}><input value={bar.link} onChange={(e) => setBar("link", e.target.value)} className={inputClass} /></Field>
        </div>
      </div>

      <div className="lg:col-span-2">
        <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? t("common.saving") : t("common.save")}</button>
      </div>
    </div>
  );
}
