import { create } from "zustand";
import axios from "axios";
import { API_URL } from "@/config/constants";
import { DEFAULT_SHOP_SETTINGS } from "../../shared/settings";

// Public store data: shipping/tax settings and product ratings
const useShopStore = create((set, get) => ({
  settings: DEFAULT_SHOP_SETTINGS,
  ratings: {},
  loaded: false,

  load: async (force = false) => {
    if (get().loaded && !force) return;
    set({ loaded: true });
    const [s, r] = await Promise.allSettled([
      axios.get(`${API_URL}/shop-settings`),
      axios.get(`${API_URL}/ratings`),
    ]);
    set({
      settings: s.status === "fulfilled" ? s.value.data : DEFAULT_SHOP_SETTINGS,
      ratings: r.status === "fulfilled" ? r.value.data : {},
    });
  },
}));

export default useShopStore;
