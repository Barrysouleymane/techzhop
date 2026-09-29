import { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, Text, Pressable, ScrollView, Modal } from "react-native";
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
  const { category, q: qParam, sale: saleParam } = useLocalSearchParams();
  const ratings = useShop((s) => s.ratings);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [brand, setBrand] = useState("");
  const [sale, setSale] = useState(false);
  const [stars, setStars] = useState(0);
  const [picker, setPicker] = useState(null); // "sort" | "brand" | null
  const [s, c] = useStyles((c) => ({
    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.card, borderRadius: 12, margin: 16, marginBottom: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border },
    input: { flex: 1, color: c.text, paddingVertical: 12, fontSize: 16 },
    chip: { flexDirection: "row", alignItems: "center", gap: 4, height: 36, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: 18, paddingHorizontal: 14, marginRight: 8 },
    sheet: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingTop: 8 },
    grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: "center", marginBottom: 8 },
    option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: c.border },
    on: { backgroundColor: c.primary, borderColor: c.primary },
  }));

  // Search / deals opened from the home screen
  useEffect(() => {
    if (qParam !== undefined) setQuery(String(qParam));
  }, [qParam]);
  useEffect(() => {
    if (saleParam !== undefined) setSale(saleParam === "1");
  }, [saleParam]);

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

  const Chip = ({ label, on, onPress, icon }) => (
    <Pressable onPress={onPress} style={[s.chip, on && s.on]}>
      <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>{label}</Text>
      {icon ? <Ionicons name={icon} size={14} color={on ? c.onPrimary : c.text} /> : null}
    </Pressable>
  );

  const pickerOptions =
    picker === "sort"
      ? SORTS.map((k) => ({ key: k, label: t(SORT_LABEL[k]), on: sort === k, pick: () => setSort(k) }))
      : [
          { key: "", label: t("products.allBrands"), on: !brand, pick: () => setBrand("") },
          ...brands.map((b) => ({ key: b, label: b, on: brand === b, pick: () => setBrand(b) })),
        ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t("products.searchPlaceholder")} placeholderTextColor={c.muted} style={s.input} returnKeyType="search" />
      </View>

      {/* One row of filters */}
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}>
          {category ? <Chip label={`${category}`} icon="close" on onPress={() => router.setParams({ category: "" })} /> : null}
          <Chip label={`🔥 ${t("products.onSaleOnly")}`} on={sale} onPress={() => setSale(!sale)} />
          <Chip label={t("products.starsUp", { count: 4 })} on={stars === 4} onPress={() => setStars(stars === 4 ? 0 : 4)} />
          <Chip label={t(SORT_LABEL[sort])} icon="chevron-down" on={sort !== "newest"} onPress={() => setPicker("sort")} />
          {brands.length > 0 ? <Chip label={brand || t("products.allBrands")} icon="chevron-down" on={!!brand} onPress={() => setPicker("brand")} /> : null}
        </ScrollView>
      </View>

      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setPicker(null)} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <ScrollView style={{ maxHeight: 420 }}>
            {pickerOptions.map((o) => (
              <Pressable key={o.key || "all"} style={s.option} onPress={() => { o.pick(); setPicker(null); }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: o.on ? "800" : "400" }}>{o.label}</Text>
                {o.on ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, flexGrow: 1 }}
        renderItem={({ item }) => <ProductCard product={item} style={{ width: "48%", marginBottom: 14 }} />}
        ListHeaderComponent={<Text style={{ color: c.muted, marginBottom: 10 }}>{t("products.count", { count: filtered.length })}</Text>}
        ListEmptyComponent={<Empty icon="search-outline">{t("products.noResults")}</Empty>}
      />
    </View>
  );
}
