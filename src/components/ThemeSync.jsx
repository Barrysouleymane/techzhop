import { useEffect } from "react";
import useSettingsStore from "@/store/settingsStore";

// Adds/removes the "light" class on <html> according to the setting.
export default function ThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");

    function apply() {
      const light = theme === "light" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("light", light);
      document.documentElement.style.colorScheme = light ? "light" : "dark";
    }

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return null;
}
