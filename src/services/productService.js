import {
  getProducts,
  getProduct,
} from "@/api/products";

export async function fetchProducts() {
  return await getProducts();
}

export async function fetchProduct(id) {
  return await getProduct(id);
}