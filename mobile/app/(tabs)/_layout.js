import { Tabs } from "expo-router";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/theme";
import { useIsAdmin } from "../../src/lib/admin";

function BrandTitle() {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image source={require("../../assets/logo-mark.png")} style={{ width: 30, height: 30, borderRadius: 15 }} />
      <Text style={{ fontSize: 20, fontWeight: "900", letterSpacing: 1 }}>
        <Text style={{ color: c.text }}>TECH</Text>
        <Text style={{ color: "#2563eb" }}>ZHOP</Text>
      </Text>
    </View>
  );
}

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
      <Tabs.Screen name="index" options={{ title: "TechZhop", headerTitle: () => <BrandTitle />, tabBarLabel: t("nav.home"), tabBarIcon: icon("home-outline") }} />
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
