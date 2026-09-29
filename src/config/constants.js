export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Comma-separated list of admin emails, e.g. VITE_ADMIN_EMAILS=me@mail.com,other@mail.com
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Customer support contact (shown on the Help page)
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "support@techzhop.com";
// WhatsApp number in international format without "+" or spaces, e.g. 224620000000
export const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP || "";
