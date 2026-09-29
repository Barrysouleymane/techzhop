import axios from "axios";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/config/constants";

export async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("LOGIN_REQUIRED");
  return { Authorization: `Bearer ${token}` };
}

// ---------- Profile ----------

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, fields) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}

export async function uploadAvatar(userId, file) {
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
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

export async function saveAddress(userId, address) {
  const { id, ...fields } = address;
  const payload = { ...fields, user_id: userId, updated_at: new Date().toISOString() };

  if (payload.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }

  const query = id
    ? supabase.from("addresses").update(payload).eq("id", id)
    : supabase.from("addresses").insert(payload);

  const { error } = await query;
  if (error) throw error;
}

export async function deleteAddress(id) {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Orders (backend) ----------

export async function getMyOrders() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return [];
  const res = await axios.get(`${API_URL}/orders/${data.user.id}`, {
    headers: await authHeaders(),
  });
  return res.data.orders || [];
}

export async function getOrder(orderId) {
  const res = await axios.get(`${API_URL}/order/${orderId}`, {
    headers: await authHeaders(),
  });
  return res.data.order;
}

// ---------- Security ----------

export async function changePassword(email, currentPassword, newPassword) {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    const err = new Error("WRONG_PASSWORD");
    err.code = "WRONG_PASSWORD";
    throw err;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function deleteMyAccount() {
  await axios.delete(`${API_URL}/account`, { headers: await authHeaders() });
  await supabase.auth.signOut();
}

// ---------- Newsletter ----------

export async function subscribeNewsletter(email, language) {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email: email.trim().toLowerCase(), language }, { onConflict: "email", ignoreDuplicates: true });
  if (error) throw error;
}

// ---------- Admin (backend) ----------

export async function adminGetOrders() {
  const res = await axios.get(`${API_URL}/admin/orders`, { headers: await authHeaders() });
  return res.data.orders || [];
}

export async function adminUpdateOrder(orderId, fields) {
  const res = await axios.patch(`${API_URL}/admin/orders/${orderId}`, fields, {
    headers: await authHeaders(),
  });
  return res.data.order;
}

export function apiError(err, t) {
  return err?.response?.data?.error || (err?.message && !/^[A-Z_]+$/.test(err.message) ? err.message : t("common.error"));
}
