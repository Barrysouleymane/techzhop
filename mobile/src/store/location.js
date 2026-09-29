import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { getAddresses } from "../lib/api";
import { resolveLocation } from "../../../shared/settings";

// Where the customer wants delivery ("Deliver to …")
// choice: { type: "address", id } | { type: "zip", country, zip } | null (= default address / phone region)
export const useLocation = create(
  persist(
    (set) => ({
      choice: null,
      addresses: [],
      open: false,
      setChoice: (choice) => set({ choice }),
      setOpen: (open) => set({ open }),
      loadAddresses: async (userId) => {
        if (!userId) return set({ addresses: [] });
        try {
          set({ addresses: await getAddresses(userId) });
        } catch {
          // keep what we had
        }
      },
    }),
    {
      name: "techzhop-location",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ choice: s.choice }),
    }
  )
);

/** { address, name, city, zip, state, country } */
export function useDeliveryLocation() {
  const choice = useLocation((s) => s.choice);
  const addresses = useLocation((s) => s.addresses);
  return useMemo(
    () => resolveLocation({ addresses, choice, region: getLocales()?.[0]?.regionCode || "US" }),
    [addresses, choice]
  );
}
