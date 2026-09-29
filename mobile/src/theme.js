import { useColorScheme } from "react-native";
import { useSettings } from "./store/settings";

const dark = {
  mode: "dark",
  bg: "#000000",
  card: "#18181b",
  border: "#27272a",
  input: "#27272a",
  text: "#ffffff",
  muted: "#a1a1aa",
  primary: "#06b6d4",
  primaryDark: "#0891b2",
  onPrimary: "#000000",
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#eab308",
  pink: "#ec4899",
};

const light = {
  mode: "light",
  bg: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  input: "#f4f4f5",
  text: "#18181b",
  muted: "#71717a",
  primary: "#0891b2",
  primaryDark: "#0e7490",
  onPrimary: "#ffffff",
  danger: "#dc2626",
  success: "#16a34a",
  warning: "#ca8a04",
  pink: "#db2777",
};

export function useColors() {
  const system = useColorScheme();
  const theme = useSettings((s) => s.theme);
  const isLight = theme === "light" || (theme === "system" && system === "light");
  return isLight ? light : dark;
}

// Kept for older imports
export const colors = dark;
