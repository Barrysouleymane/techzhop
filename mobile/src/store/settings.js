import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// language / currency: null = automatic (from the phone settings)
// theme: "system" | "light" | "dark"
export const useSettings = create(
  persist(
    (set) => ({
      language: null,
      currency: null,
      theme: "system",
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "techzhop-settings", storage: createJSONStorage(() => AsyncStorage) }
  )
);
