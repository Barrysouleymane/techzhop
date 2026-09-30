import axios from "axios";
import { API_URL } from "@/config/constants";
import { authHeaders } from "@/api/account";

async function call(method, path, data) {
  const res = await axios({ method, url: `${API_URL}${path}`, data, headers: await authHeaders() });
  return res.data;
}

export const adminApi = {
  me: () => call("get", "/admin/me").then((d) => d.admin),
  meta: () => call("get", "/admin/meta"),
  stats: () => call("get", "/admin/stats"),
  products: () => call("get", "/admin/products").then((d) => d.products),
  product: (id) => call("get", `/admin/products/${id}`).then((d) => d.product),
  create: (p) => call("post", "/admin/products", p).then((d) => d.product),
  update: (id, p) => call("patch", `/admin/products/${id}`, p).then((d) => d.product),
  remove: (id) => call("delete", `/admin/products/${id}`),
  order: (id) => call("get", `/admin/orders/${id}`),
  team: () => call("get", "/admin/team").then((d) => d.members),
  settings: () => call("get", "/admin/settings"),
  saveSettings: (v) => call("put", "/admin/settings", v),
  banners: () => call("get", "/admin/banners").then((d) => d.banners),
  createBanner: (b) => call("post", "/admin/banners", b).then((d) => d.banner),
  updateBanner: (id, b) => call("patch", `/admin/banners/${id}`, b).then((d) => d.banner),
  deleteBanner: (id) => call("delete", `/admin/banners/${id}`),
  promos: () => call("get", "/admin/promos").then((d) => d.promos),
  createPromo: (p) => call("post", "/admin/promos", p),
  setPromoActive: (id, active) => call("patch", `/admin/promos/${id}`, { active }),
  setRole: (email, role, language, country) => call("post", "/admin/team", { email, role, language, ...(country !== undefined ? { country } : {}) }),
  finances: () => call("get", "/admin/finances"),
  verifyPayment: (id, decision) => call("post", `/admin/orders/${id}/payment`, { decision }).then((d) => d.order),
  remitCash: (driver_id, currency) => call("post", "/admin/finances/remit", { driver_id, currency }),
  drivers: () => call("get", "/admin/drivers").then((d) => d.drivers || []),
  decide: (id, decision, message) => call("post", `/admin/orders/${id}/decision`, { decision, message }).then((d) => d.order),
  refund: (id, body) => call("post", `/admin/orders/${id}/refund`, body).then((d) => d.order),
  updateOrder: (id, fields) => call("patch", `/admin/orders/${id}`, fields).then((d) => d.order),
  createCategory: (name) => call("post", "/admin/categories", { name }).then((d) => d.item),
  createBrand: (name) => call("post", "/admin/brands", { name }).then((d) => d.item),
  upload: async (file) => {
    const { base64, type } = await resizeImage(file);
    return call("post", "/admin/upload", { data: base64, contentType: type }).then((d) => d.url);
  },
};

// Shrinks big photos (max 1600px, JPEG) before uploading
function resizeImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(img.src);
      resolve({ base64: dataUrl.split(",")[1], type: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
