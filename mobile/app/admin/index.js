import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Image, TextInput, Alert, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi, useStaff } from "../../src/lib/admin";
import AdminTeam from "../../src/components/AdminTeam";
import AdminFinances from "../../src/components/AdminFinances";
import { StoreSettings, BannersAdmin, PromosAdmin } from "../../src/components/AdminStore";
import { errorMessage } from "../../src/lib/api";
import { Loading, Empty, useStyles } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/OrderStatus";
import { ORDER_STATUSES, formatUSD, flag } from "../../../shared/settings";

export default function AdminHome() {
  const { t, i18n } = useTranslation();
  const staff = useStaff();
  const tabs = [
    staff.can("products") && ["products", t("admin.productsTab")],
    staff.can("orders") && ["orders", t("admin.ordersTab")],
    staff.can("store") && ["store", t("admin.storeTab")],
    staff.can("store") && ["banners", t("admin.bannersTab")],
    staff.can("store") && ["promos", t("admin.promosTab")],
    staff.can("revenue") && ["finances", t("finances.tab")],
    staff.can("team") && ["team", t("team.tab")],
  ].filter(Boolean);
  const [chosen, setTab] = useState("");
  const tab = tabs.some(([id]) => id === chosen) ? chosen : tabs[0]?.[0];
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
    tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: c.border },
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
    if (!staff.admin) return;
    const [st, pr, or] = await Promise.allSettled([
      adminApi.stats(),
      staff.can("products") ? adminApi.products() : Promise.resolve([]),
      staff.can("orders") ? adminApi.orders() : Promise.resolve([]),
    ]);
    if (st.status === "fulfilled") setStats(st.value);
    if (pr.status === "fulfilled") setProducts(pr.value);
    if (or.status === "fulfilled") setOrders(or.value);
    const failed = [st, pr, or].find((r) => r.status === "rejected");
    if (failed) Alert.alert(t("common.error"), errorMessage(failed.reason, t));
    setLoading(false);
  }, [t, staff.admin, staff.role]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loading && staff.admin) return <Loading />;
  if (!staff.admin) return <Loading />;

  const usd = (n) => formatUSD(n, i18n.language);

  const header = (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {[
          stats?.revenue !== null && stats?.revenue !== undefined && [t("admin.revenue"), usd(stats.revenue)],
          [t("admin.ordersCount"), stats?.orders ?? 0],
          [t("admin.toShip"), stats?.toShip ?? 0],
          [t("admin.products"), stats?.products ?? 0],
          [t("admin.lowStock"), stats?.lowStock ?? 0],
        ].filter(Boolean).map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={s.statLabel}>{label}</Text>
            <Text style={s.statValue}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {tabs.map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[s.tab, tab === id && s.tabOn]}>
            <Text style={{ color: tab === id ? c.onPrimary : c.text, fontWeight: "700" }}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  const Panel = { team: AdminTeam, store: StoreSettings, banners: BannersAdmin, promos: PromosAdmin, finances: AdminFinances }[tab];
  if (Panel) {
    return (
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {header}
        <View style={{ padding: 16 }}>
          <Panel />
        </View>
      </ScrollView>
    );
  }

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
          <Pressable style={s.order} onPress={() => router.push({ pathname: "/admin/order", params: { id: o.id } })}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={s.name}>#{o.id} · {usd(o.total)}</Text>
              <Pressable onPress={() => changeStatus(o)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <StatusBadge status={o.status} />
                {o.request_status === "pending" ? <Text style={{ color: c.warning, fontSize: 12, fontWeight: "700" }}>↩️ {t("returns.badge")}</Text> : null}
                {o.country && o.country !== "US" ? <Text style={{ fontSize: 14 }}>{flag(o.country)}</Text> : null}
                {o.payment_method === "momo" && o.payment_status === "pending" ? <Text style={{ color: "#f97316", fontSize: 12, fontWeight: "700" }}>📱</Text> : null}
                {o.payment_method === "cod" ? <Text style={{ color: o.payment_status === "collected" ? c.success : c.warning, fontSize: 12, fontWeight: "700" }}>💵</Text> : null}
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
          </Pressable>
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
