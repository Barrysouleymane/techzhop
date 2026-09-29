import { useMemo } from "react";
import useLocationStore from "@/store/locationStore";
import { resolveLocation } from "../../shared/settings";

function deviceRegion() {
  try {
    const tag = navigator.languages?.[0] || navigator.language || "";
    const region = new Intl.Locale(tag).maximize().region;
    return region || "US";
  } catch {
    return "US";
  }
}

/** { address, name, city, zip, state, country } — the place we deliver to */
export default function useDeliveryLocation() {
  const choice = useLocationStore((s) => s.choice);
  const addresses = useLocationStore((s) => s.addresses);
  return useMemo(() => resolveLocation({ addresses, choice, region: deviceRegion() }), [addresses, choice]);
}
