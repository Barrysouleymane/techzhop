import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, X, Check } from "lucide-react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import useLocationStore from "@/store/locationStore";
import useDeliveryLocation from "@/hooks/useDeliveryLocation";
import { countryOptions, locationPlace, firstName, formatAddress } from "../../../shared/settings";

/** "Deliver to Souleymane — Brooklyn 11225" button in the top bar */
export default function DeliverTo() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const loc = useDeliveryLocation();
  const setOpen = useLocationStore((s) => s.setOpen);
  const loadAddresses = useLocationStore((s) => s.loadAddresses);

  // Refresh saved addresses when the user or the page changes (e.g. after editing addresses)
  useEffect(() => {
    loadAddresses(user?.id);
  }, [user?.id, pathname, loadAddresses]);

  const name = firstName(loc.name);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-end gap-1 text-left text-white hover:text-cyan-400 transition bg-transparent border-0 p-0 cursor-pointer min-w-0"
        title={t("location.title")}
      >
        <MapPin className="w-5 h-5 shrink-0 mb-0.5" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-xs text-gray-400 truncate max-w-[150px]">
            {name ? t("location.deliverToName", { name }) : t("location.deliverTo")}
          </span>
          <span className="text-sm font-bold truncate max-w-[150px]">{locationPlace(loc, i18n.language)}</span>
        </span>
      </button>
      <LocationModal />
    </>
  );
}

/** Small bar under the header on phones */
export function DeliverToMobile() {
  const { t, i18n } = useTranslation();
  const loc = useDeliveryLocation();
  const setOpen = useLocationStore((s) => s.setOpen);
  const name = firstName(loc.name);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="sm:hidden w-full flex items-center gap-2 px-4 py-2 bg-zinc-900 text-gray-200 text-sm border-0 border-t border-zinc-800 cursor-pointer text-left"
    >
      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
      <span className="truncate">
        {name ? t("location.deliverToName", { name }) : t("location.deliverTo")} — <b>{locationPlace(loc, i18n.language)}</b>
      </span>
    </button>
  );
}

function LocationModal() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const open = useLocationStore((s) => s.open);
  const setOpen = useLocationStore((s) => s.setOpen);
  const addresses = useLocationStore((s) => s.addresses);
  const setChoice = useLocationStore((s) => s.setChoice);
  const loadAddresses = useLocationStore((s) => s.loadAddresses);
  const loc = useDeliveryLocation();
  const [country, setCountry] = useState(loc.country);
  const [zip, setZip] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadAddresses(user?.id);
    setCountry(loc.country);
    setZip(loc.address ? "" : loc.zip);
    setDirty(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const close = () => setOpen(false);
  const pick = (a) => {
    setChoice({ type: "address", id: a.id });
    toast.success(t("location.updated"));
    close();
  };
  const apply = () => {
    setChoice({ type: "zip", country, zip: zip.trim().toUpperCase() });
    toast.success(t("location.updated"));
    close();
  };
  const go = (to) => {
    close();
    navigate(to, { state: { from: window.location.pathname } });
  };

  const selectedId = loc.address?.id;
  const input = "w-full rounded-lg border border-zinc-700 bg-zinc-950 text-white px-3 py-2.5 focus:outline-none focus:border-cyan-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("location.title")}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold m-0">{t("location.title")}</h2>
          <button onClick={close} className="p-1 bg-transparent border-0 text-gray-400 hover:text-white cursor-pointer" aria-label={t("common.close", "Close")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-400 text-sm m-0">{t("location.intro")}</p>

          {user ? (
            <>
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => pick(a)}
                  className={`w-full text-left rounded-xl border-2 p-4 cursor-pointer bg-zinc-950 text-white transition ${
                    a.id === selectedId ? "border-cyan-500" : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold">{a.full_name}</span>{" "}
                      <span className="text-gray-300">{formatAddress({ ...a, full_name: "", phone: "" })}</span>
                      {a.is_default && <div className="text-gray-400 text-sm font-semibold mt-1">{t("location.default")}</div>}
                    </div>
                    {a.id === selectedId && <Check className="w-5 h-5 text-cyan-400 shrink-0" />}
                  </div>
                </button>
              ))}
              <button onClick={() => go("/addresses")} className="bg-transparent border-0 p-0 text-cyan-400 hover:underline cursor-pointer">
                {addresses.length ? t("location.manage") : t("location.addAddress")}
              </button>
            </>
          ) : (
            <Link to="/login" onClick={close} className="block text-center rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 no-underline">
              {t("location.signIn")}
            </Link>
          )}

          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <span className="flex-1 h-px bg-zinc-800" />
            {t("location.orZip")}
            <span className="flex-1 h-px bg-zinc-800" />
          </div>

          <label className="block">
            <span className="text-sm text-gray-400">{t("location.country")}</span>
            <select value={country} onChange={(e) => { setCountry(e.target.value); setDirty(true); }} className={`${input} mt-1`}>
              {countryOptions(i18n.language, country).map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <input
              value={zip}
              onChange={(e) => { setZip(e.target.value); setDirty(true); }}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={t("location.zip")}
              maxLength={12}
              className={input}
            />
            <button onClick={apply} className="shrink-0 rounded-lg border border-zinc-600 bg-transparent text-white px-5 hover:border-cyan-500 cursor-pointer">
              {t("location.apply")}
            </button>
          </div>
        </div>

        <div className="flex justify-end px-6 pb-5">
          <button
            onClick={() => (dirty ? apply() : close())}
            className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-2 border-0 cursor-pointer"
          >
            {t("location.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
