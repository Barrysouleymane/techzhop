import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getShopSettings, getRatings } from "../lib/api";
import { DEFAULT_SHOP_SETTINGS } from "../../../shared/settings";

// Shipping/tax settings + product ratings (public)
export const useShop = create((set, get) => ({
  settings: DEFAULT_SHOP_SETTINGS,
  ratings: {},
  loaded: false,
  load: async (force = false) => {
    if (get().loaded && !force) return;
    set({ loaded: true });
    const [s, r] = await Promise.allSettled([getShopSettings(), getRatings()]);
    set({
      settings: s.status === "fulfilled" ? s.value : DEFAULT_SHOP_SETTINGS,
      ratings: r.status === "fulfilled" ? r.value : {},
    });
  },
}));

// Recently viewed products
export const useRecent = create(
  persist(
    (set) => ({
      ids: [],
      add: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })),
    }),
    { name: "techzhop-recent", storage: createJSONStorage(() => AsyncStorage) }
  )
);
