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
