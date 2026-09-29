import { create } from "zustand";
import { persist } from "zustand/middleware";

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (id) => get().items.some((p) => p.id === id),

      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((p) => p.id === product.id);
          return {
            items: exists
              ? state.items.filter((p) => p.id !== product.id)
              : [
                  ...state.items,
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stock: product.stock,
                  },
                ],
          };
        }),

      remove: (id) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== id) })),

      clear: () => set({ items: [] }),
    }),
    { name: "techzhop-wishlist" }
  )
);

export default useWishlistStore;
