import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { getProducts } from "../../src/lib/api";
import ProductCard from "../../src/components/ProductCard";
import { Loading, useStyles } from "../../src/components/ui";

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
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
  }));

  const load = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (e) {
      console.log("PRODUCTS ERROR", e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;

  const categories = [...new Set(products.map((p) => p.categories?.name).filter(Boolean))];
  const deals = products.filter((p) => p.stock > 0).sort((a, b) => a.price - b.price).slice(0, 4);

  const Grid = ({ list }) => (
    <View style={s.grid}>
      {list.map((p) => (
        <ProductCard key={p.id} product={p} style={s.cell} />
      ))}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={c.primary} />}
    >
      <View style={s.hero}>
        <Text style={s.heroTitle}>{t("home.heroTitle")}</Text>
        <Text style={s.heroText}>{t("home.heroText")}</Text>
        <Pressable style={s.heroBtn} onPress={() => router.push("/products")}>
          <Text style={{ fontWeight: "800", color: "#000" }}>{t("home.shopNow")}</Text>
        </Pressable>
      </View>

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

      {deals.length > 0 && (
        <>
          <Text style={[s.section, { color: c.danger }]}>🔥 {t("home.deals")}</Text>
          <Grid list={deals} />
        </>
      )}

      <Text style={s.section}>{t("home.latest")}</Text>
      <Grid list={products.slice(0, 8)} />
    </ScrollView>
  );
}
