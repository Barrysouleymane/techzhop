import { supabase } from "./supabase";
import { effectivePrice } from "../../../shared/settings";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:5173";
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "support@techzhop.com";
export const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || "";

function loginRequired() {
  const err = new Error("LOGIN_REQUIRED");
  err.code = "LOGIN_REQUIRED";
  return err;
}

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ---------- Catalog ----------

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

// ---------- Cart ----------

export async function getCart() {
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addToCart(productId) {
  const user = await currentUser();
  if (!user) throw loginRequired();
  const { data: existing, error: e1 } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (e1) throw e1;
  if (existing) return setQuantity(existing.id, existing.quantity + 1);
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

// ---------- Backend helper ----------

export async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw loginRequired();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Server error (${res.status})`);
  return body;
}

export async function createCheckoutSession(cart, shippingAddress, address) {
  const items = cart.map((item) => ({
    product_id: item.product_id,
    name: item.products?.name,
    price: effectivePrice(item.products),
    quantity: Number(item.quantity || 0),
  }));
  return request("/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({
      items,
      shipping_address: shippingAddress || "",
      address_id: address?.id,
      address: address ? { country: address.country, state: address.state, city: address.city, postal_code: address.postal_code } : null,
      return_to: "app",
    }),
  });
}

/** Pay on delivery: creates the order right away */
export async function placeCodOrder(cart, addressId) {
  const items = cart.map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity || 0) }));
  return request("/orders/cod", { method: "POST", body: JSON.stringify({ items, address_id: addressId }) });
}

// ---------- Driver ----------

export const getDeliveries = () => request("/driver/deliveries").then((d) => d.deliveries || []);
export const updateDelivery = (id, body) =>
  request(`/driver/deliveries/${id}`, { method: "POST", body: JSON.stringify(body) }).then((d) => d.delivery);

// ---------- Public store data ----------

async function publicGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

export const getShopSettings = () => publicGet("/shop-settings");
export const getRatings = () => publicGet("/ratings");
export const getBanners = () => publicGet("/banners").then((d) => d.banners || []);
export const getReviews = (productId) => publicGet(`/products/${productId}/reviews`).then((d) => d.reviews || []);

export async function canReview(productId) {
  try {
    return !!(await request(`/products/${productId}/can-review`)).canReview;
  } catch {
    return false;
  }
}

export const postReview = (productId, review) =>
  request(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(review) });

export const deleteReview = (id) => request(`/reviews/${id}`, { method: "DELETE" });

/** After payment: makes sure the order is saved and returns its id */
export async function confirmCheckout(sessionId) {
  const res = await fetch(`${API_URL}/checkout-session/${sessionId}`);
  const body = await res.json().catch(() => ({}));
  return body.order_id || null;
}

export async function getOrders() {
  const user = await currentUser();
  if (!user) return [];
  return (await request(`/orders/${user.id}`)).orders || [];
}

export async function getOrder(id) {
  return (await request(`/order/${id}`)).order;
}

export async function requestOrderHelp(id, type, reason) {
  return (await request(`/orders/${id}/request`, { method: "POST", body: JSON.stringify({ type, reason }) })).order;
}

export async function deleteMyAccount() {
  await request("/account", { method: "DELETE" });
  await supabase.auth.signOut();
}

// ---------- Profile ----------

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, fields) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}

export async function uploadAvatar(userId, asset) {
  const ext = (asset.uri.split(".").pop() || "jpg").split("?")[0].toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const buffer = await (await fetch(asset.uri)).arrayBuffer();

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: asset.mimeType || "image/jpeg" });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}

// ---------- Addresses ----------

export async function getAddresses(userId) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAddress(id) {
  const { data, error } = await supabase.from("addresses").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function saveAddress(userId, address) {
  const { id, created_at, ...fields } = address;
  const payload = { ...fields, user_id: userId, updated_at: new Date().toISOString() };
  if (payload.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }
  const { error } = id
    ? await supabase.from("addresses").update(payload).eq("id", id)
    : await supabase.from("addresses").insert(payload);
  if (error) throw error;
}

export async function deleteAddress(id) {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Security ----------

export async function changePassword(email, currentPassword, newPassword) {
  const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (e1) {
    const err = new Error("WRONG_PASSWORD");
    err.code = "WRONG_PASSWORD";
    throw err;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  // The link opens the website's reset page
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${WEB_URL}/reset-password`,
  });
  if (error) throw error;
}

export function errorMessage(err, t) {
  if (!err) return t("common.error");
  if (err.code === "LOGIN_REQUIRED") return t("product.loginFirst");
  if (err.message && !/^[A-Z_]+$/.test(err.message)) return err.message;
  return t("common.error");
}
