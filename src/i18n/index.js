import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../../shared/locales/en.json";
import fr from "../../shared/locales/fr.json";
import es from "../../shared/locales/es.json";
import pt from "../../shared/locales/pt.json";
import de from "../../shared/locales/de.json";
import zh from "../../shared/locales/zh.json";
import { SUPPORTED_LANGUAGES, pickLanguage } from "../../shared/settings";

const STORAGE_KEY = "techzhop-lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      de: { translation: de },
      zh: { translation: zh },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      // 1. the language the user picked, 2. the browser/device language
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: [],
    },
  });

function syncHtmlLang(lng) {
  document.documentElement.lang = pickLanguage(lng);
}
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

/** null = automatic (device language) */
export function getLanguageChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLanguageChoice(code) {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, code);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  i18n.changeLanguage(code || pickLanguage(navigator.language));
}

export default i18n;
