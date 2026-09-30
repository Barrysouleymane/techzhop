import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, LocateFixed, CheckCircle2 } from "lucide-react";
import Page, { Field, btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import { getAddresses, saveAddress, deleteAddress } from "@/api/account";
import { formatAddress, countryOptions, normalizeCountry, needsLandmark, sellingCountries } from "../../shared/settings";
import useShopStore from "@/store/shopStore";
import useDeliveryLocation from "@/hooks/useDeliveryLocation";

const EMPTY = { label: "", full_name: "", phone: "", line1: "", line2: "", neighborhood: "", landmark: "", city: "", state: "", postal_code: "", country: "", latitude: null, longitude: null, is_default: false };

export default function Addresses() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const settings = useShopStore((s) => s.settings);
  const here = useDeliveryLocation();
  const [locating, setLocating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // null | address object
  const [saving, setSaving] = useState(false);

  const load = () => user && getAddresses(user.id).then(setList).catch(console.error);
  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const a = { ...editing, country: normalizeCountry(editing.country), is_default: editing.is_default || list.length === 0 };
      // New fields are only sent when filled (works before the "countries" SQL is run)
      for (const k of ["neighborhood", "landmark", "latitude", "longitude"]) if (a[k] === "" || a[k] == null) delete a[k];
      await saveAddress(user.id, a);
      setEditing(null);
      await load();
      toast.success(t("common.saved"));
      if (location.state?.from) navigate(location.state.from);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("addresses.deleteConfirm"))) return;
    await deleteAddress(id);
    load();
  }

  async function makeDefault(a) {
    await saveAddress(user.id, { ...a, is_default: true });
    load();
  }

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  function locate() {
    if (!navigator.geolocation) return toast.error(t("addresses.locationError"));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditing((e) => ({ ...e, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
        toast.success(t("addresses.locationSaved"));
      },
      () => {
        setLocating(false);
        toast.error(t("addresses.locationError"));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const newAddress = () => {
    const selling = sellingCountries(settings);
    const country = selling.includes(here.country) ? here.country : selling[0] || "US";
    setEditing({ ...EMPTY, country });
  };

  if (editing) {
    return (
      <Page title={editing.id ? t("addresses.edit") : t("addresses.add")} width="max-w-2xl">
        <form onSubmit={handleSave} className={`${card} p-6 sm:p-8 grid sm:grid-cols-2 gap-4`}>
          <div className="sm:col-span-2">
            <Field label={t("addresses.country")}>
              <select required value={normalizeCountry(editing.country)} onChange={set("country")} className={inputClass}>
                <option value="">—</option>
                {countryOptions(i18n.language, editing.country).map((c) => (
                  <option key={c.code} value={c.code}>{c.name}{sellingCountries(settings).includes(c.code) ? "" : ` · ${t("addresses.notDelivered")}`}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={`${t("addresses.label")} (${t("common.optional")})`}><input value={editing.label || ""} onChange={set("label")} placeholder={t("addresses.labelPlaceholder")} className={inputClass} /></Field>
          <Field label={t("addresses.fullName")}><input required value={editing.full_name} onChange={set("full_name")} className={inputClass} /></Field>
          {(() => {
            const africa = needsLandmark(editing.country);
            return (
              <>
                <div className="sm:col-span-2">
                  <Field label={t("addresses.phone")} hint={africa ? t("addresses.phoneHint") : undefined}>
                    <input type="tel" required={africa} value={editing.phone || ""} onChange={set("phone")} placeholder={africa ? "+224 6xx xx xx xx" : ""} className={inputClass} />
                  </Field>
                </div>
                <div className="sm:col-span-2"><Field label={africa ? t("addresses.line1Africa") : t("addresses.line1")}><input required value={editing.line1} onChange={set("line1")} autoComplete="address-line1" className={inputClass} /></Field></div>
                {africa ? (
                  <>
                    <Field label={t("addresses.neighborhood")}><input required value={editing.neighborhood || ""} onChange={set("neighborhood")} placeholder="Kaloum, Ratoma, Matoto…" className={inputClass} /></Field>
                    <Field label={t("addresses.city")}><input required value={editing.city} onChange={set("city")} placeholder="Conakry" className={inputClass} /></Field>
                    <div className="sm:col-span-2">
                      <Field label={t("addresses.landmark")} hint={t("addresses.landmarkHint")}>
                        <input required value={editing.landmark || ""} onChange={set("landmark")} placeholder={t("addresses.landmarkPlaceholder")} className={inputClass} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={locate} disabled={locating} className={btnSecondary}>
                        <LocateFixed className="w-4 h-4" /> {locating ? t("common.loading") : t("addresses.useLocation")}
                      </button>
                      {editing.latitude != null && (
                        <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> {t("addresses.locationSaved")}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sm:col-span-2"><Field label={`${t("addresses.line2")} (${t("common.optional")})`}><input value={editing.line2 || ""} onChange={set("line2")} autoComplete="address-line2" className={inputClass} /></Field></div>
                    <Field label={t("addresses.city")}><input required value={editing.city} onChange={set("city")} className={inputClass} /></Field>
                    <Field label={`${t("addresses.state")} (${t("common.optional")})`}><input value={editing.state || ""} onChange={set("state")} className={inputClass} /></Field>
                    <Field label={`${t("addresses.postalCode")} (${t("common.optional")})`}><input value={editing.postal_code || ""} onChange={set("postal_code")} className={inputClass} /></Field>
                  </>
                )}
              </>
            );
          })()}
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
            {t("addresses.setDefault")}
          </label>
          <div className="sm:col-span-2 flex gap-3">
            <button disabled={saving} className={btnPrimary}>{saving ? t("common.saving") : t("common.save")}</button>
            <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>{t("common.cancel")}</button>
          </div>
        </form>
      </Page>
    );
  }

  return (
    <Page
      title={t("addresses.title")}
      width="max-w-3xl"
      back="/account"
      backLabel={t("account.title")}
      actions={<button onClick={newAddress} className={btnPrimary}><Plus className="w-4 h-4" /> {t("addresses.add")}</button>}
    >
      {list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-14 h-14 mx-auto mb-4" />
          <p>{t("addresses.empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <div key={a.id} className={`${card} p-5 flex gap-4`}>
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong>{a.label || a.full_name}</strong>
                  {a.is_default && <span className="text-xs bg-cyan-500 text-black font-bold rounded-full px-2 py-0.5">{t("addresses.default")}</span>}
                </div>
                <p className="text-gray-400 text-sm mt-1 mb-0">{formatAddress(a)}</p>
                {!a.is_default && (
                  <button onClick={() => makeDefault(a)} className="text-cyan-400 text-sm mt-2">{t("addresses.setDefault")}</button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(a)} aria-label={t("common.edit")} className="p-2 hover:text-cyan-400 text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} aria-label={t("common.delete")} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
