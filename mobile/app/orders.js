import { useEffect, useState } from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { getOrders } from "../src/lib/api";
import { Loading, Empty } from "../src/components/ui";
import { colors } from "../src/theme";

const STATUS = { paid: colors.success, pending: "#eab308", failed: colors.danger };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <Empty>{error}</Empty>;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => String(o.id)}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListEmptyComponent={<Empty>You haven't placed any orders yet.</Empty>}
      renderItem={({ item: o }) => (
        <View style={styles.card}>
          <View style={styles.head}>
            <View>
              <Text style={styles.title}>Order #{o.id}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(o.created_at).toLocaleString()}</Text>
            </View>
            <Text style={[styles.status, { color: STATUS[o.status] || colors.muted }]}>{o.status}</Text>
          </View>
          {(o.order_items || []).map((it) => (
            <View key={it.id} style={styles.line}>
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{it.product_name} × {it.quantity}</Text>
              <Text style={{ color: colors.text }}>${(Number(it.price) * it.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.line, styles.total]}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>Total</Text>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>${Number(o.total).toFixed(2)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14 },
  head: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  title: { color: colors.text, fontWeight: "800", fontSize: 16 },
  status: { fontWeight: "700", textTransform: "capitalize" },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, gap: 12 },
  total: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 10 },
});
