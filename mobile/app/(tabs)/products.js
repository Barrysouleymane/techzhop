import { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getProducts } from "../../src/lib/api";
import ProductCard from "../../src/components/ProductCard";
import { Loading, Empty, useStyles } from "../../src/components/ui";

export default function Products() {
  const { t } = useTranslation();
  const { category } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [s, c] = useStyles((c) => ({
    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.card, borderRadius: 12, margin: 16, marginBottom: 0, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border },
    input: { flex: 1, color: c.text, paddingVertical: 12, fontSize: 16 },
    filter: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: c.primaryDark, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginLeft: 16, marginTop: 12 },
  }));

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !category || p.categories?.name === category)
      .filter((p) => !q || [p.name, p.description, p.brands?.name].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
  }, [products, query, category]);

  if (loading) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t("products.searchPlaceholder")} placeholderTextColor={c.muted} style={s.input} returnKeyType="search" />
      </View>

      {category ? (
        <Pressable style={s.filter} onPress={() => router.setParams({ category: "" })}>
          <Text style={{ color: "#fff" }}>{category}</Text>
          <Ionicons name="close" size={16} color="#fff" />
        </Pressable>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => <ProductCard product={item} style={{ width: "48%", marginBottom: 14 }} />}
        ListHeaderComponent={<Text style={{ color: c.muted, marginBottom: 10 }}>{t("products.count", { count: filtered.length })}</Text>}
        ListEmptyComponent={<Empty icon="search-outline">{t("products.noResults")}</Empty>}
      />
    </View>
  );
}
