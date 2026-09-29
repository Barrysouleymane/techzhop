export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Comma-separated list of admin emails, e.g. VITE_ADMIN_EMAILS=me@mail.com,other@mail.com
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
