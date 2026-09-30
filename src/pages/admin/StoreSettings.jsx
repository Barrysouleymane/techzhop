import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";
import { Field, btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";
import useShopStore from "@/store/shopStore";
import { countryOptions, countryName, flag, CURRENCIES, DEFAULT_COUNTRIES } from "../../../shared/settings";

export default function StoreSettings() {
  const { t, i18n } = useTranslation();
  const [newCountry, setNewCountry] = useState("");
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

  const countries = v.countries || DEFAULT_COUNTRIES;
  const setC = (code, patch) => setV({ ...v, countries: { ...countries, [code]: { ...countries[code], ...patch } } });
  const togglePay = (code, m) => {
    const cur = countries[code].payments || [];
    const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
    setC(code, { payments: next.length ? next : cur });
  };
  const removeCountry = (code) => {
    if (Object.keys(countries).length <= 1) return toast.error(t("countries.lastOne"));
    if (!window.confirm(t("countries.removeConfirm", { country: countryName(code, i18n.language) }))) return;
    const next = { ...countries };
    delete next[code];
    setV({ ...v, countries: next });
    toast(t("countries.removedSave"));
  };
  const addCountry = () => {
    if (!newCountry || countries[newCountry]) return;
    setV({ ...v, countries: { ...countries, [newCountry]: { enabled: true, currency: "USD", rate: 1, payments: ["cod"], own_stock: true, local_delivery: { enabled: true, areas: [] }, min_days: 1, max_days: 3 } } });
    setNewCountry("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className={`${card} p-6 space-y-4 lg:col-span-2`}>
        <h2 className="text-xl font-bold m-0">🌍 {t("countries.title")}</h2>
        <p className="text-gray-400 text-sm m-0">{t("countries.intro")} {t("countries.closeHint")}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(countries).map(([code, c]) => (
            <div key={code} className={`rounded-xl border p-4 space-y-3 ${c.enabled ? "border-cyan-500/50" : "border-zinc-800 opacity-70"}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-lg">{flag(code)} {countryName(code, i18n.language)}</strong>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={!!c.enabled} onChange={(e) => setC(code, { enabled: e.target.checked })} /> {t("countries.enabled")}
                  </label>
                  <button type="button" onClick={() => removeCountry(code)} title={t("countries.remove")} aria-label={t("countries.remove")} className="text-red-400 hover:text-red-300 bg-transparent border-0 p-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("countries.currency")}>
                  <select value={c.currency} onChange={(e) => setC(code, { currency: e.target.value })} className={small}>
                    {CURRENCIES.map((x) => <option key={x.code} value={x.code}>{x.code}</option>)}
                  </select>
                </Field>
                <Field label={t("countries.rate", { currency: c.currency })}>
                  <input type="number" min="0" step="any" value={c.rate} disabled={c.currency === "USD"} onChange={(e) => setC(code, { rate: e.target.value })} className={small} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-400">{t("countries.payments")}:</span>
                {["card", "cod"].map((m) => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={(c.payments || []).includes(m)} onChange={() => togglePay(code, m)} /> {t(`checkout.method.${m}`)}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={!!c.own_stock} onChange={(e) => setC(code, { own_stock: e.target.checked })} /> {t("countries.ownStock")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={!!c.local_delivery?.enabled} onChange={(e) => setC(code, { local_delivery: { ...(c.local_delivery || {}), enabled: e.target.checked } })} /> {t("countries.ownDrivers")}
              </label>
              {c.local_delivery?.enabled && (
                <Field label={t("countries.areas")} hint={t("countries.areasHint")}>
                  <input
                    value={(c.local_delivery?.areas || []).join(", ")}
                    onChange={(e) => setC(code, { local_delivery: { ...c.local_delivery, areas: e.target.value.split(",").map((x) => x.trim()) } })}
                    placeholder={code === "US" ? "NY, 112, 100" : "Conakry"}
                    className={small}
                  />
                </Field>
              )}
              <Field label={t("countries.days")} hint={t("countries.daysHint")}>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" value={c.min_days || 0} onChange={(e) => setC(code, { min_days: e.target.value })} placeholder={t("admin.minDays")} className={small} />
                  <input type="number" min="0" value={c.max_days || 0} onChange={(e) => setC(code, { max_days: e.target.value })} placeholder={t("admin.maxDays")} className={small} />
                </div>
              </Field>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className={`${small} max-w-xs`}>
            <option value="">{t("countries.choose")}</option>
            {countryOptions(i18n.language).filter((o) => !countries[o.code]).map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
          <button onClick={addCountry} disabled={!newCountry} className={btnSecondary}><Plus className="w-4 h-4" /> {t("countries.add")}</button>
        </div>
      </div>

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
