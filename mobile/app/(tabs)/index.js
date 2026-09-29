import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, RefreshControl, Pressable, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { getProducts, getBanners, getOrders } from "../../src/lib/api";
import useAuth from "../../src/lib/useAuth";
import { useShop, useRecent } from "../../src/store/shop";
import ProductCard from "../../src/components/ProductCard";
import { PromoBar } from "../../src/components/Shop";
import { useLocation, useDeliveryLocation } from "../../src/store/location";
import { locationPlace, firstName } from "../../../shared/settings";
import { Loading, useStyles } from "../../src/components/ui";
import { isOnSale, discountPercent } from "../../../shared/settings";

function openLink(link) {
  if (!link) return;
  if (link.startsWith("/")) router.push(link);
}

const CHIP_COLORS = ["#2563eb", "#7c3aed", "#16a34a", "#db2777", "#ea580c", "#0891b2"];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const loc = useDeliveryLocation();
  const openLocation = useLocation((st) => st.setOpen);
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const reloadShop = useShop((s) => s.load);
  const recentIds = useRecent((s) => s.ids);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [boughtIds, setBoughtIds] = useState([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [s, c] = useStyles((c) => ({
    hero: { backgroundColor: c.primaryDark, borderRadius: 20, padding: 24, marginBottom: 8 },
    heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
    heroText: { color: "#e0f7fa", marginTop: 8 },
    heroBtn: { backgroundColor: "#fff", alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginTop: 16 },
    section: { color: c.text, fontSize: 20, fontWeight: "800", marginTop: 20, marginBottom: 12 },
    chip: { borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    cell: { width: "48%", marginBottom: 14 },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
    search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.input, borderRadius: 26, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 16, height: 50 },
    searchInput: { flex: 1, color: c.text, fontSize: 16 },
    pin: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center" },
    topChip: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginRight: 10 },
    banner: { height: 190, borderRadius: 20, overflow: "hidden", backgroundColor: c.card },
  }));

  const load = useCallback(async () => {
    const [p, b] = await Promise.allSettled([getProducts(), getBanners()]);
    if (p.status === "fulfilled") setProducts(p.value);
    if (b.status === "fulfilled") setBanners(b.value);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return setBoughtIds([]);
    getOrders()
      .then((orders) => setBoughtIds([...new Set(orders.flatMap((o) => (o.order_items || []).map((i) => i.product_id)).filter(Boolean))]))
      .catch(() => {});
  }, [user]);

  if (loading) return <Loading />;

  const bannerWidth = width - 32;
  const categories = [...new Set(products.map((p) => p.categories?.name).filter(Boolean))];
  const onSale = products.filter(isOnSale).sort((a, b) => discountPercent(b) - discountPercent(a));
  const deals = (onSale.length ? onSale : products.filter((p) => p.stock > 0).sort((a, b) => a.price - b.price)).slice(0, 4);
  const byIds = (ids) => ids.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4);

  const Grid = ({ list }) => (
    <View style={s.grid}>
      {list.map((p) => <ProductCard key={p.id} product={p} style={s.cell} />)}
    </View>
  );

  const Section = ({ title, list, color }) =>
    list.length ? (
      <>
        <Text style={[s.section, color && { color }]}>{title}</Text>
        <Grid list={list} />
      </>
    ) : null;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reloadShop(true); load(); }} tintColor={c.primary} />}
    >
      {/* Amazon-style top: quick chips, search + location button */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Pressable style={[s.topChip, { backgroundColor: "#fff", borderWidth: 1, borderColor: c.border }]} onPress={() => router.push({ pathname: "/products", params: { sale: "1" } })}>
          <Text style={{ color: "#0e7490", fontWeight: "800" }}>🔥 {t("home.deals")}</Text>
        </Pressable>
        {categories.map((cat, i) => (
          <Pressable key={cat} style={[s.topChip, { backgroundColor: CHIP_COLORS[i % CHIP_COLORS.length] }]} onPress={() => router.push({ pathname: "/products", params: { category: cat } })}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.searchRow}>
        <View style={s.search}>
          <Ionicons name="search" size={22} color={c.text} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("products.searchPlaceholder")}
            placeholderTextColor={c.muted}
            style={s.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => { router.push({ pathname: "/products", params: { q: search.trim() } }); setSearch(""); }}
          />
        </View>
        <Pressable style={s.pin} onPress={() => openLocation(true)} accessibilityLabel={t("location.title")}>
          <Ionicons name="location-outline" size={24} color={c.text} />
        </Pressable>
      </View>
      <Pressable onPress={() => openLocation(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ color: c.muted, fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
          {firstName(loc.name) ? t("location.deliverToName", { name: firstName(loc.name) }) : t("location.deliverTo")}{" "}
          <Text style={{ color: c.text, fontWeight: "700" }}>{locationPlace(loc, i18n.language)}</Text>
        </Text>
        <Ionicons name="chevron-down" size={14} color={c.muted} />
      </Pressable>
      <PromoBar />
      {banners.length ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / bannerWidth))}
            style={{ width: bannerWidth }}
          >
            {banners.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => openLink(b.link)}
                style={[s.banner, { width: bannerWidth }, !b.title && !b.subtitle && { height: bannerWidth / 2.5 }]}
              >
                <Image source={{ uri: b.image }} style={{ position: "absolute", width: "100%", height: "100%" }} resizeMode="cover" />
                {b.title || b.subtitle ? (
                  <View style={{ flex: 1, justifyContent: "flex-end", padding: 16, backgroundColor: "rgba(0,0,0,0.35)" }}>
                    {b.title ? <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{b.title}</Text> : null}
                    {b.subtitle ? <Text style={{ color: "#e4e4e7", marginTop: 4 }}>{b.subtitle}</Text> : null}
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
          {banners.length > 1 && (
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
              {banners.map((b, i) => <View key={b.id} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === slide ? c.primary : c.border }} />)}
            </View>
          )}
        </View>
      ) : (
        <View style={s.hero}>
          <Text style={s.heroTitle}>{t("home.heroTitle")}</Text>
          <Text style={s.heroText}>{t("home.heroText")}</Text>
          <Pressable style={s.heroBtn} onPress={() => router.push("/products")}>
            <Text style={{ fontWeight: "800", color: "#000" }}>{t("home.shopNow")}</Text>
          </Pressable>
        </View>
      )}


      <Section title={t("home.buyAgain")} list={byIds(boughtIds)} />
      <Section title={`🔥 ${onSale.length ? t("home.limitedDeals") : t("home.deals")}`} list={deals} color={c.danger} />
      <Section title={t("home.recentlyViewed")} list={byIds(recentIds)} />
      <Section title={t("home.latest")} list={products.slice(0, 8)} />
    </ScrollView>
  );
}
