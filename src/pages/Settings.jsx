import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Page, { card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import useSettingsStore from "@/store/settingsStore";
import { useCurrency } from "@/hooks/useMoney";
import { getLanguageChoice, setLanguageChoice } from "@/i18n";
import { getProfile, updateProfile } from "@/api/account";
import { LANGUAGES, CURRENCIES } from "../../shared/settings";

function Section({ id, title, children }) {
  return (
    <section id={id} className={`${card} p-6 scroll-mt-28`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, text }) {
  return (
    <label className="flex items-start gap-4 py-3 cursor-pointer">
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-gray-400 text-sm">{text}</span>
      </span>
      <input type="checkbox" className="w-5 h-5 mt-1 accent-cyan-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const { user } = useAuth();
  const chosenCurrency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const effectiveCurrency = useCurrency();
  const [lang, setLang] = useState(getLanguageChoice() || "auto");
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) =>
      setPrefs({ notify_orders: p?.notify_orders ?? true, notify_promos: p?.notify_promos ?? false })
    );
  }, [user]);

  async function savePref(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      await updateProfile(user.id, { [key]: value });
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  const select = "w-full sm:w-80 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white";

  return (
    <Page title={t("settings.title")} width="max-w-3xl" back={user ? "/account" : "/"} backLabel={user ? t("account.title") : t("nav.home")}>
      <div className="space-y-6">
        <Section id="language" title={t("settings.language")}>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              setLanguageChoice(e.target.value === "auto" ? null : e.target.value);
            }}
            className={select}
          >
            <option value="auto">{t("settings.languageAuto")}</option>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </Section>

        <Section id="currency" title={t("settings.currency")}>
          <select value={chosenCurrency || "auto"} onChange={(e) => setCurrency(e.target.value === "auto" ? null : e.target.value)} className={select}>
            <option value="auto">{t("settings.currencyAuto")} ({effectiveCurrency})</option>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
          <p className="text-gray-400 text-sm mt-3 mb-0">{t("settings.currencyNote")}</p>
        </Section>

        <Section id="theme" title={t("settings.theme")}>
          <div className="flex flex-wrap gap-3">
            {[["system", t("settings.themeSystem")], ["light", t("settings.themeLight")], ["dark", t("settings.themeDark")]].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`px-5 py-3 rounded-lg border ${theme === value ? "border-cyan-500 text-cyan-400" : "border-zinc-700 text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {user && prefs && (
          <Section id="notifications" title={t("settings.notifications")}>
            <div className="divide-y divide-zinc-800">
              <Toggle checked={prefs.notify_orders} onChange={(v) => savePref("notify_orders", v)} label={t("settings.notifyOrders")} text={t("settings.notifyOrdersText")} />
              <Toggle checked={prefs.notify_promos} onChange={(v) => savePref("notify_promos", v)} label={t("settings.notifyPromos")} text={t("settings.notifyPromosText")} />
            </div>
          </Section>
        )}
      </div>
    </Page>
  );
}
