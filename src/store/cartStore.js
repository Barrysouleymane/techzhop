import { create } from "zustand";
import { getCart, addToCart, setCartQuantity, removeFromCart } from "@/api/cart";

// One shared cart for the whole site (navbar badge, cart page, checkout…)
const useCartStore = create((set, get) => ({
  items: [],
  loading: true,

  load: async () => {
    try {
      set({ items: await getCart() });
    } catch (err) {
      console.error("CART LOAD ERROR:", err);
    } finally {
      set({ loading: false });
    }
  },

  add: async (productId) => {
    await addToCart(productId);
    await get().load();
  },

  setQuantity: async (itemId, quantity) => {
    await setCartQuantity(itemId, quantity);
    await get().load();
  },

  remove: async (itemId) => {
    await removeFromCart(itemId);
    await get().load();
  },

  count: () => get().items.reduce((t, i) => t + Number(i.quantity || 0), 0),

  totalUSD: () =>
    get().items.reduce(
      (t, i) => t + Number(i.products?.price || 0) * Number(i.quantity || 0),
      0
    ),
}));

export default useCartStore;
