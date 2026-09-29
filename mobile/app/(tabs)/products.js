import { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getProducts } from "../../src/lib/api";
import { useShop } from "../../src/store/shop";
import ProductCard from "../../src/components/ProductCard";
import { Loading, Empty, useStyles } from "../../src/components/ui";
import { effectivePrice, isOnSale, discountPercent } from "../../../shared/settings";

const SORTS = ["newest", "price-asc", "price-desc", "rating", "discount"];
const SORT_LABEL = { newest: "products.sortNewest", "price-asc": "products.sortPriceAsc", "price-desc": "products.sortPriceDesc", rating: "products.sortRating", discount: "products.sortDiscount" };

export default function Products() {
  const { t } = useTranslation();
  const { category } = useLocalSearchParams();
  const ratings = useShop((s) => s.ratings);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [brand, setBrand] = useState("");
  const [sale, setSale] = useState(false);
  const [stars, setStars] = useState(0);
  const [s, c] = useStyles((c) => ({
    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.card, borderRadius: 12, margin: 16, marginBottom: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border },
    input: { flex: 1, color: c.text, paddingVertical: 12, fontSize: 16 },
    chip: { borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
    on: { backgroundColor: c.primary, borderColor: c.primary },
  }));

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brands?.name).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rate = (p) => ratings[p.id]?.avg || 0;
    const sorts = {
      newest: () => 0,
      "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
      "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
      rating: (a, b) => rate(b) - rate(a),
      discount: (a, b) => discountPercent(b) - discountPercent(a),
    };
    return products
      .filter((p) => !category || p.categories?.name === category)
      .filter((p) => !brand || p.brands?.name === brand)
      .filter((p) => !sale || isOnSale(p))
      .filter((p) => !stars || rate(p) >= stars)
      .filter((p) => !q || [p.name, p.description, p.brands?.name].filter(Boolean).some((v) => v.toLowerCase().includes(q)))
      .sort(sorts[sort]);
  }, [products, ratings, query, category, brand, sale, stars, sort]);

  if (loading) return <Loading />;

  const Chip = ({ label, on, onPress }) => (
    <Pressable onPress={onPress} style={[s.chip, on && s.on]}>
      <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t("products.searchPlaceholder")} placeholderTextColor={c.muted} style={s.input} returnKeyType="search" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
        {category ? <Chip label={`${category} ✕`} on onPress={() => router.setParams({ category: "" })} /> : null}
        <Chip label={`🔥 ${t("products.onSaleOnly")}`} on={sale} onPress={() => setSale(!sale)} />
        <Chip label={t("products.starsUp", { count: 4 })} on={stars === 4} onPress={() => setStars(stars === 4 ? 0 : 4)} />
        {SORTS.map((k) => <Chip key={k} label={t(SORT_LABEL[k])} on={sort === k} onPress={() => setSort(k)} />)}
      </ScrollView>
      {brands.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }} style={{ flexGrow: 0 }}>
          <Chip label={t("products.allBrands")} on={!brand} onPress={() => setBrand("")} />
          {brands.map((b) => <Chip key={b} label={b} on={brand === b} onPress={() => setBrand(brand === b ? "" : b)} />)}
        </ScrollView>
      )}

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
