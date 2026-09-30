import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useSettingsStore from "@/store/settingsStore";
import useShopStore from "@/store/shopStore";
import {
  FALLBACK_RATES,
  getRates,
  formatMoney,
  currencyForRegion,
  shopRates,
} from "../../shared/settings";

function browserRegion() {
  try {
    return new Intl.Locale(navigator.language).maximize().region;
  } catch {
    return null;
  }
}

export function useCurrency() {
  const chosen = useSettingsStore((s) => s.currency);
  return chosen || currencyForRegion(browserRegion());
}

/** const money = useMoney(); money(19.99) -> "18,39 €" */
export default function useMoney() {
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

  const settings = useShopStore((s) => s.settings);
  const merged = shopRates(settings, rates); // the shop's fixed GNF rate = what drivers collect
  return (amountUSD) => formatMoney(amountUSD, currency, merged, i18n.language);
}
