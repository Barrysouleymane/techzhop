import { useEffect } from "react";

const SITE = "TechZhop";
const DEFAULT_TITLE = "TechZhop — Tech · Gaming · Lifestyle";

/** Sets the browser tab title (and optionally the meta description) for this page */
export default function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : DEFAULT_TITLE;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", String(description).slice(0, 160));
    }
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
}
