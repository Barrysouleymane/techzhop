import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, RefreshControl, Pressable, Image, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { getProducts, getBanners, getOrders } from "../../src/lib/api";
import useAuth from "../../src/lib/useAuth";
import { useShop, useRecent } from "../../src/store/shop";
import ProductCard from "../../src/components/ProductCard";
import { PromoBar } from "../../src/components/Shop";
import { Loading, useStyles } from "../../src/components/ui";
import { isOnSale, discountPercent } from "../../../shared/settings";

function openLink(link) {
  if (!link) return;
  if (link.startsWith("/")) router.push(link);
}

export default function Home() {
  const { t } = useTranslation();
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

      {categories.length > 0 && (
        <>
          <Text style={s.section}>{t("home.categories")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <Pressable key={cat} style={s.chip} onPress={() => router.push({ pathname: "/products", params: { category: cat } })}>
                <Text style={{ color: c.text }}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Section title={t("home.buyAgain")} list={byIds(boughtIds)} />
      <Section title={`🔥 ${onSale.length ? t("home.limitedDeals") : t("home.deals")}`} list={deals} color={c.danger} />
      <Section title={t("home.recentlyViewed")} list={byIds(recentIds)} />
      <Section title={t("home.latest")} list={products.slice(0, 8)} />
    </ScrollView>
  );
}
