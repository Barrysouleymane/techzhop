import { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, StyleSheet, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts } from "../../src/lib/api";
import ProductCard from "../../src/components/ProductCard";
import { Loading, Empty } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function Products() {
  const { category } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !category || p.categories?.name === category)
      .filter((p) =>
        !q || [p.name, p.description, p.brands?.name].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      );
  }, [products, query, category]);

  if (loading) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      {category ? (
        <Pressable style={styles.filter} onPress={() => router.setParams({ category: "" })}>
          <Text style={{ color: colors.text }}>{category}</Text>
          <Ionicons name="close" size={16} color={colors.text} />
        </Pressable>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => <ProductCard product={item} style={{ width: "48%", marginBottom: 14 }} />}
        ListEmptyComponent={<Empty>No products found.</Empty>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.card, borderRadius: 12, margin: 16, marginBottom: 0, paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 16 },
  filter: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: colors.primaryDark, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginLeft: 16, marginTop: 12,
  },
});
