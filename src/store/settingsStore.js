import { create } from "zustand";
import { persist } from "zustand/middleware";

// currency: null = automatic (from the browser's region)
// theme: "system" | "light" | "dark"
const useSettingsStore = create(
  persist(
    (set) => ({
      currency: null,
      theme: "system",
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "techzhop-settings" }
  )
);

export default useSettingsStore;
