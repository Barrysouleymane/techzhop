import { useEffect, useState } from "react";
import { request } from "./api";
import useAuth from "./useAuth";

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const adminApi = {
  me: () => request("/admin/me").then((d) => d.admin),
  meta: () => request("/admin/meta"),
  stats: () => request("/admin/stats"),
  products: () => request("/admin/products").then((d) => d.products),
  product: (id) => request(`/admin/products/${id}`).then((d) => d.product),
  create: (p) => request("/admin/products", json("POST", p)).then((d) => d.product),
  update: (id, p) => request(`/admin/products/${id}`, json("PATCH", p)).then((d) => d.product),
  remove: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
  orders: () => request("/admin/orders").then((d) => d.orders),
  order: (id) => request(`/admin/orders/${id}`),
  team: () => request("/admin/team").then((d) => d.members),
  settings: () => request("/admin/settings"),
  saveSettings: (v) => request("/admin/settings", json("PUT", v)),
  banners: () => request("/admin/banners").then((d) => d.banners),
  createBanner: (b) => request("/admin/banners", json("POST", b)),
  updateBanner: (id, b) => request(`/admin/banners/${id}`, json("PATCH", b)),
  deleteBanner: (id) => request(`/admin/banners/${id}`, { method: "DELETE" }),
  promos: () => request("/admin/promos").then((d) => d.promos),
  createPromo: (p) => request("/admin/promos", json("POST", p)),
  setPromoActive: (id, active) => request(`/admin/promos/${id}`, json("PATCH", { active })),
  setRole: (email, role, language, country) => request("/admin/team", json("POST", { email, role, language, ...(country !== undefined ? { country } : {}) })),
  finances: () => request("/admin/finances"),
  remitCash: (driver_id, currency) => request("/admin/finances/remit", json("POST", { driver_id, currency })),
  drivers: () => request("/admin/drivers").then((d) => d.drivers || []),
  decide: (id, decision, message) => request(`/admin/orders/${id}/decision`, json("POST", { decision, message })).then((d) => d.order),
  refund: (id, body) => request(`/admin/orders/${id}/refund`, json("POST", body)).then((d) => d.order),
  updateOrder: (id, fields) => request(`/admin/orders/${id}`, json("PATCH", fields)).then((d) => d.order),
  createCategory: (name) => request("/admin/categories", json("POST", { name })).then((d) => d.item),
  createBrand: (name) => request("/admin/brands", json("POST", { name })).then((d) => d.item),
  upload: (base64, contentType = "image/jpeg") =>
    request("/admin/upload", json("POST", { data: base64, contentType })).then((d) => d.url),
};

const NONE = { admin: false, driver: false, role: "customer", country: null, owner: false, permissions: [] };

/** Staff info for the logged-in user: { admin, role, owner, permissions, can(p) } */
export function useStaff() {
  const { user } = useAuth();
  const [info, setInfo] = useState(NONE);
  useEffect(() => {
    if (!user) return setInfo(NONE);
    request("/admin/me").then((d) => setInfo({ ...NONE, ...d })).catch(() => setInfo(NONE));
  }, [user]);
  return { ...info, can: (p) => info.permissions.includes(p) };
}

/** true when the logged-in user can open the admin area */
export function useIsAdmin() {
  return useStaff().admin;
}

/** true when the logged-in user is a driver */
export function useIsDriver() {
  return useStaff().driver;
}
