import "../src/i18n";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import i18n, { deviceLanguage } from "../src/i18n";
import { useSettings } from "../src/store/settings";
import { useColors } from "../src/theme";
import useAuth from "../src/lib/useAuth";
import { registerForPush } from "../src/lib/push";
import { request } from "../src/lib/api";
import { useShop } from "../src/store/shop";

// Applies the language chosen in Settings (or the phone language)
function useLanguageSync() {
  const language = useSettings((s) => s.language);
  useEffect(() => {
    i18n.changeLanguage(language || deviceLanguage());
  }, [language]);
}

export default function RootLayout() {
  useLanguageSync();
  const { t, i18n: i } = useTranslation();
  const c = useColors();
  const { user } = useAuth();
  const loadShop = useShop((s) => s.load);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  useEffect(() => {
    if (user) registerForPush(user.id, i.language);
  }, [user, i.language]);

  // Welcome email (sent once by the server) + remember the language for emails
  useEffect(() => {
    if (!user) return;
    request("/me/welcome", { method: "POST", body: JSON.stringify({ language: i.language }) }).catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) request("/me/language", { method: "POST", body: JSON.stringify({ language: i.language }) }).catch(() => {});
  }, [i.language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StatusBar style={c.mode === "light" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          contentStyle: { backgroundColor: c.bg },
          headerBackTitle: t("common.back"),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: "" }} />
        <Stack.Screen name="orders/index" options={{ title: t("orders.title") }} />
        <Stack.Screen name="orders/[id]" options={{ title: t("orders.title") }} />
        <Stack.Screen name="wishlist" options={{ title: t("wishlist.title") }} />
        <Stack.Screen name="profile" options={{ title: t("profile.title") }} />
        <Stack.Screen name="addresses/index" options={{ title: t("addresses.title") }} />
        <Stack.Screen name="addresses/edit" options={{ title: t("addresses.edit") }} />
        <Stack.Screen name="settings" options={{ title: t("settings.title") }} />
        <Stack.Screen name="security" options={{ title: t("security.title") }} />
        <Stack.Screen name="help" options={{ title: t("help.title") }} />
        <Stack.Screen name="legal/[type]" options={{ title: "" }} />
        <Stack.Screen name="admin/index" options={{ title: t("admin.title") }} />
        <Stack.Screen name="admin/product" options={{ title: t("admin.editProduct") }} />
        <Stack.Screen name="admin/order" options={{ title: t("admin.orderDetails") }} />
        <Stack.Screen name="forgot-password" options={{ title: t("auth.forgotTitle"), presentation: "modal" }} />
      </Stack>
    </>
  );
}
