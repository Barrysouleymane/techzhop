import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { getProducts } from "../../src/lib/api";
import ProductCard from "../../src/components/ProductCard";
import { Loading } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;

  const categories = [...new Set(products.map((p) => p.categories?.name).filter(Boolean))];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>The latest tech,{"\n"}at the best price.</Text>
        <Text style={styles.heroText}>Phones, laptops, audio and more.</Text>
        <Pressable style={styles.heroBtn} onPress={() => router.push("/products")}>
          <Text style={{ fontWeight: "800" }}>Shop now</Text>
        </Pressable>
      </View>

      {categories.length > 0 && (
        <>
          <Text style={styles.section}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {categories.map((c) => (
              <Pressable
                key={c}
                style={styles.chip}
                onPress={() => router.push({ pathname: "/products", params: { category: c } })}
              >
                <Text style={{ color: colors.text }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.section}>Latest products</Text>
      <View style={styles.grid}>
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} style={styles.cell} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primaryDark, borderRadius: 20, padding: 24, marginBottom: 16 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  heroText: { color: "#e0f7fa", marginTop: 8 },
  heroBtn: { backgroundColor: "#fff", alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginTop: 16 },
  section: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 16, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cell: { width: "48%", marginBottom: 14 },
});
