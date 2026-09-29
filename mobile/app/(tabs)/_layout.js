import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/theme";
import { useIsAdmin } from "../../src/lib/admin";

const icon = (name) => ({ color, size }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  const { t } = useTranslation();
  const c = useColors();
  const isAdmin = useIsAdmin();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "TECHZHOP", tabBarLabel: t("nav.home"), tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="products" options={{ title: t("nav.products"), tabBarIcon: icon("grid-outline") }} />
      <Tabs.Screen name="cart" options={{ title: t("nav.cart"), tabBarIcon: icon("cart-outline") }} />
      <Tabs.Screen
        name="admin"
        options={{ title: t("admin.title"), tabBarLabel: t("nav.admin"), tabBarIcon: icon("shield-checkmark-outline"), href: isAdmin ? undefined : null }}
      />
      <Tabs.Screen name="account" options={{ title: t("nav.account"), tabBarIcon: icon("person-outline") }} />
    </Tabs>
  );
}
