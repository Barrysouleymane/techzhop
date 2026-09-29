import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "../../../shared/locales/en.json";
import fr from "../../../shared/locales/fr.json";
import es from "../../../shared/locales/es.json";
import pt from "../../../shared/locales/pt.json";
import de from "../../../shared/locales/de.json";
import zh from "../../../shared/locales/zh.json";
import { SUPPORTED_LANGUAGES, pickLanguage } from "../../../shared/settings";

export function deviceLanguage() {
  return pickLanguage(getLocales()?.[0]?.languageCode);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    pt: { translation: pt },
    de: { translation: de },
    zh: { translation: zh },
  },
  lng: deviceLanguage(),
  supportedLngs: SUPPORTED_LANGUAGES,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
