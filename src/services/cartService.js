import {
  addToCart,
  getCart,
} from "@/api/cart";

export async function cartAdd(productId) {
  return await addToCart(productId);
}

export async function fetchCart() {
  return await getCart();
}