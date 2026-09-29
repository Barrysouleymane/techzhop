import { supabase } from "./supabase";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// ---------- Products (Supabase, same queries as the website) ----------

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, brands(name, logo), categories(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*, brands(name, logo), categories(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ---------- Cart (table cart_items) ----------

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first.");
  return user;
}

export async function getCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(id, name, price, image, stock)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addToCart(productId) {
  const user = await requireUser();
  const { data: existing, error: e1 } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (e1) throw e1;

  if (existing) {
    return setQuantity(existing.id, existing.quantity + 1);
  }

  const { error } = await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id: productId, quantity: 1 });
  if (error) throw error;
}

export async function setQuantity(cartItemId, quantity) {
  if (quantity <= 0) return removeFromCart(cartItemId);
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", cartItemId);
  if (error) throw error;
}

export async function removeFromCart(cartItemId) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

// ---------- Backend (Express) ----------

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please login first.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: await authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Server error (${res.status})`);
  return body;
}

export async function createCheckoutSession(cart) {
  const items = cart.map((item) => ({
    product_id: item.product_id,
    name: item.products?.name,
    price: Number(item.products?.price || 0),
    quantity: Number(item.quantity || 0),
  }));
  return request("/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function getOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const body = await request(`/orders/${user.id}`);
  return body.orders || [];
}
