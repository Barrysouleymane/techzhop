import { useCallback, useState } from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getOrders, errorMessage } from "../../src/lib/api";
import { Loading, Empty, Button, useStyles } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/OrderStatus";
import { formatUSD } from "../../../shared/settings";

export default function Orders() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [s, c] = useStyles((c) => ({
    card: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", gap: 12 },
    title: { color: c.text, fontWeight: "800", fontSize: 16 },
  }));

  useFocusEffect(
    useCallback(() => {
      getOrders().then(setOrders).catch((e) => setError(errorMessage(e, t))).finally(() => setLoading(false));
    }, [t])
  );

  if (loading) return <Loading />;
  if (error) return <Empty icon="alert-circle-outline">{error}</Empty>;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => String(o.id)}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListEmptyComponent={<Empty icon="receipt-outline" action={<Button title={t("orders.startShopping")} onPress={() => router.push("/products")} />}>{t("orders.empty")}</Empty>}
      renderItem={({ item: o }) => (
        <Pressable style={s.card} onPress={() => router.push(`/orders/${o.id}`)}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.title}>{t("orders.order", { id: o.id })}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{t("orders.placedOn", { date: new Date(o.created_at).toLocaleDateString(i18n.language) })}</Text>
            <StatusBadge status={o.status} />
          </View>
          <Text style={{ color: c.primary, fontWeight: "800" }}>{formatUSD(o.total, i18n.language)}</Text>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </Pressable>
      )}
    />
  );
}
