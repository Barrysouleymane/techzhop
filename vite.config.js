import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Adds robots.txt (with the sitemap served by the API) and absolute
// share-image links when the site is built for production.
function seo(env) {
  const site = (env.VITE_SITE_URL || "").replace(/\/$/, "");
  const api = (env.VITE_API_URL || "").replace(/\/$/, "");
  return {
    name: "techzhop-seo",
    transformIndexHtml(html) {
      if (!site) return html;
      return html
        .replace('content="/logo.png"', `content="${site}/logo.png"`)
        .replace("</head>", `    <link rel="canonical" href="${site}/" />\n    <meta property="og:url" content="${site}/" />\n  </head>`);
    },
    generateBundle() {
      const lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /account",
        "Disallow: /checkout",
        "Disallow: /cart",
        "Disallow: /orders",
        "Disallow: /profile",
        "Disallow: /addresses",
        "Disallow: /security",
        "Disallow: /settings",
      ];
      if (api) lines.push("", `Sitemap: ${api}/sitemap.xml`);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: lines.join("\n") + "\n" });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), seo(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
