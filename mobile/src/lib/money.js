import { useEffect, useState } from "react";
import { getLocales } from "expo-localization";
import { useTranslation } from "react-i18next";
import { useSettings } from "../store/settings";
import {
  FALLBACK_RATES,
  getRates,
  formatMoney,
  currencyForRegion,
  CURRENCIES,
} from "../../../shared/settings";

export function deviceCurrency() {
  const loc = getLocales()?.[0];
  const code = loc?.currencyCode;
  if (code && CURRENCIES.some((c) => c.code === code)) return code;
  return currencyForRegion(loc?.regionCode);
}

export function useCurrency() {
  const chosen = useSettings((s) => s.currency);
  return chosen || deviceCurrency();
}

/** const money = useMoney(); money(19.99) */
export function useMoney() {
  const { i18n } = useTranslation();
  const currency = useCurrency();
  const [rates, setRates] = useState(FALLBACK_RATES);

  useEffect(() => {
    let alive = true;
    getRates().then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, []);

  return (usd) => formatMoney(usd, currency, rates, i18n.language);
}
