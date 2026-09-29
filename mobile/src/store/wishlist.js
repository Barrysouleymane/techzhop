import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useWishlist = create(
  persist(
    (set) => ({
      items: [],
      toggle: (p) =>
        set((s) => ({
          items: s.items.some((i) => i.id === p.id)
            ? s.items.filter((i) => i.id !== p.id)
            : [...s.items, { id: p.id, name: p.name, price: p.price, image: p.image, stock: p.stock }],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: "techzhop-wishlist", storage: createJSONStorage(() => AsyncStorage) }
  )
);
