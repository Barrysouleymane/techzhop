import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Image, TextInput, Alert, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../src/lib/admin";
import { errorMessage } from "../../src/lib/api";
import { Loading, Empty, useStyles } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/OrderStatus";
import { ORDER_STATUSES, formatUSD } from "../../../shared/settings";

export default function AdminHome() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("products");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [s, c] = useStyles((c) => ({
    stat: { backgroundColor: c.card, borderRadius: 12, padding: 12, marginRight: 10, minWidth: 110, borderWidth: 1, borderColor: c.border },
    statLabel: { color: c.muted, fontSize: 12 },
    statValue: { color: c.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
    tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: c.border },
    tabOn: { backgroundColor: c.primary, borderColor: c.primary },
    search: { backgroundColor: c.card, color: c.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, margin: 16, marginBottom: 4, borderWidth: 1, borderColor: c.border },
    row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: c.border },
    thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    name: { color: c.text, fontWeight: "700" },
    muted: { color: c.muted, fontSize: 12 },
    fab: { position: "absolute", right: 20, bottom: 30, backgroundColor: c.primary, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", gap: 6, alignItems: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    order: { backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: c.border, gap: 6 },
    tracking: { backgroundColor: c.input, color: c.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: c.border },
  }));

  const load = useCallback(async () => {
    try {
      const [st, pr, or] = await Promise.all([adminApi.stats(), adminApi.products(), adminApi.orders()]);
      setStats(st);
      setProducts(pr);
      setOrders(or);
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => !q || [p.name, p.sku, p.brands?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [products, query]);

  function changeStatus(order) {
    Alert.alert(t("admin.changeStatus"), t("orders.order", { id: order.id }), [
      ...ORDER_STATUSES.map((st) => ({
        text: t(`orders.status.${st}`),
        onPress: () => updateOrder(order, { status: st }),
      })),
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  async function updateOrder(order, fields) {
    try {
      const updated = await adminApi.updateOrder(order.id, fields);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    }
  }

  if (loading) return <Loading />;

  const usd = (n) => formatUSD(n, i18n.language);

  const header = (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {[
          [t("admin.revenue"), usd(stats?.revenue || 0)],
          [t("admin.ordersCount"), stats?.orders ?? 0],
          [t("admin.toShip"), stats?.toShip ?? 0],
          [t("admin.products"), stats?.products ?? 0],
          [t("admin.lowStock"), stats?.lowStock ?? 0],
        ].map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={s.statLabel}>{label}</Text>
            <Text style={s.statValue}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={s.tabs}>
        {[["products", t("admin.productsTab")], ["orders", t("admin.ordersTab")]].map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[s.tab, tab === id && s.tabOn]}>
            <Text style={{ color: tab === id ? c.onPrimary : c.text, fontWeight: "700" }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  if (tab === "orders") {
    return (
      <FlatList
        style={{ backgroundColor: c.bg }}
        data={orders}
        keyExtractor={(o) => String(o.id)}
        ListHeaderComponent={<View style={{ marginBottom: 12, marginHorizontal: -16 }}>{header}</View>}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={<Empty icon="receipt-outline">{t("admin.noOrders")}</Empty>}
        renderItem={({ item: o }) => (
          <View style={s.order}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={s.name}>#{o.id} · {usd(o.total)}</Text>
              <Pressable onPress={() => changeStatus(o)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <StatusBadge status={o.status} />
                <Ionicons name="chevron-down" size={16} color={c.muted} />
              </Pressable>
            </View>
            <Text style={s.muted}>{new Date(o.created_at).toLocaleString(i18n.language)}</Text>
            {(o.order_items || []).map((i) => (
              <Text key={i.id} style={{ color: c.text }}>{i.product_name} × {i.quantity}</Text>
            ))}
            {o.shipping_address ? <Text style={s.muted}>{o.shipping_address}</Text> : null}
            <TextInput
              defaultValue={o.tracking_number || ""}
              placeholder={t("admin.trackingPlaceholder")}
              placeholderTextColor={c.muted}
              style={s.tracking}
              onEndEditing={(e) => {
                const v = e.nativeEvent.text;
                if (v !== (o.tracking_number || "")) updateOrder(o, { tracking_number: v });
              }}
            />
          </View>
        )}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={
          <View style={{ marginHorizontal: -16 }}>
            {header}
            <TextInput value={query} onChangeText={setQuery} placeholder={t("admin.search")} placeholderTextColor={c.muted} style={s.search} />
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item: p }) => {
          const hidden = p.status && p.status !== "active";
          return (
            <Pressable style={s.row} onPress={() => router.push({ pathname: "/admin/product", params: { id: p.id } })}>
              <View style={s.thumb}>
                {p.image ? <Image source={{ uri: p.image }} style={{ width: "90%", height: "90%" }} resizeMode="contain" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={s.muted}>{usd(p.price)} · {t("admin.stock")}: <Text style={{ color: Number(p.stock) > 3 ? c.muted : c.danger }}>{p.stock ?? 0}</Text></Text>
                {hidden && <Text style={[s.muted, { color: c.warning }]}>{t("admin.hidden")}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          );
        }}
      />
      <Pressable style={s.fab} onPress={() => router.push("/admin/product")}>
        <Ionicons name="add" size={22} color={c.onPrimary} />
        <Text style={{ color: c.onPrimary, fontWeight: "800" }}>{t("admin.newProduct")}</Text>
      </Pressable>
    </View>
  );
}
