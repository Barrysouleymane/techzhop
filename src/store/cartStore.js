import { create } from "zustand";

const useCartStore = create((set) => ({
  cart: [],

  addToCart: (product) =>
    set((state) => ({
      cart: [...state.cart, product],
    })),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    })),

  clearCart: () =>
    set({
      cart: [],
    }),

  totalItems: () =>
    useCartStore.getState().cart.length,

  totalPrice: () =>
    useCartStore
      .getState()
      .cart.reduce(
        (total, item) => total + Number(item.price),
        0
      ),
}));

export default useCartStore;