import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "../../shared/settings";
import { getLanguageChoice, setLanguageChoice } from "@/i18n";

/** Compact language picker (footer). "auto" = device language. */
export default function LanguageSelect({ className = "" }) {
  const { t, i18n } = useTranslation();
  const choice = getLanguageChoice() || "auto";

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4" />
      <select
        value={choice}
        onChange={(e) => setLanguageChoice(e.target.value === "auto" ? null : e.target.value)}
        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white"
        aria-label={t("settings.language")}
        key={i18n.language}
      >
        <option value="auto">{t("settings.languageAuto")}</option>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
