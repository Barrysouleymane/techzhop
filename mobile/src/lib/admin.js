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
  setRole: (email, role) => request("/admin/team", json("POST", { email, role })),
  updateOrder: (id, fields) => request(`/admin/orders/${id}`, json("PATCH", fields)).then((d) => d.order),
  createCategory: (name) => request("/admin/categories", json("POST", { name })).then((d) => d.item),
  createBrand: (name) => request("/admin/brands", json("POST", { name })).then((d) => d.item),
  upload: (base64, contentType = "image/jpeg") =>
    request("/admin/upload", json("POST", { data: base64, contentType })).then((d) => d.url),
};

const NONE = { admin: false, role: "customer", owner: false, permissions: [] };

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

/** true when the logged-in user has any staff role */
export function useIsAdmin() {
  return useStaff().admin;
}
