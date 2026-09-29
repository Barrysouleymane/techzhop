import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, Alert, Pressable, useWindowDimensions } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getProduct, getProducts, addToCart, errorMessage } from "../../src/lib/api";
import { useShop, useRecent } from "../../src/store/shop";
import { Stars, PriceTag, Countdown } from "../../src/components/Shop";
import Reviews from "../../src/components/Reviews";
import ProductCard from "../../src/components/ProductCard";
import { isOnSale, deliveryRange } from "../../../shared/settings";
import { useWishlist } from "../../src/store/wishlist";
import { useMoney } from "../../src/lib/money";
import { Button, Loading, Empty, useStyles } from "../../src/components/ui";

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const settings = useShop((st) => st.settings);
  const rating = useShop((st) => st.ratings[id]);
  const addRecent = useRecent((st) => st.add);
  const [similar, setSimilar] = useState([]);
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [photo, setPhoto] = useState(0);
  const { width } = useWindowDimensions();
  const toggle = useWishlist((s) => s.toggle);
  const liked = useWishlist((s) => s.items.some((i) => String(i.id) === String(id)));
  const [s, c] = useStyles((c) => ({
    imageBox: { backgroundColor: "#fff", height: 320, alignItems: "center", justifyContent: "center" },
    name: { color: c.text, fontSize: 24, fontWeight: "800" },
    price: { color: c.primary, fontSize: 28, fontWeight: "800", marginTop: 8 },
    meta: { color: c.muted, marginTop: 4 },
    h2: { color: c.text, fontSize: 18, fontWeight: "800", marginTop: 20 },
    desc: { color: c.muted, marginTop: 8, lineHeight: 22, fontSize: 15 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  }));

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        addRecent(Number(id));
        getProducts()
          .then((all) => setSimilar(all.filter((x) => x.id !== p.id && x.categories?.name === p.categories?.name).slice(0, 4)))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, addRecent]);

  async function handleAdd() {
    setAdding(true);
    try {
      await addToCart(product.id);
      Alert.alert(t("product.addedToCart", { name: product.name }), undefined, [
        { text: t("product.keepShopping") },
        { text: t("product.viewCart"), onPress: () => router.push("/cart") },
      ]);
    } catch (e) {
      if (e.code === "LOGIN_REQUIRED") {
        Alert.alert(t("product.loginFirst"), undefined, [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("auth.login"), onPress: () => router.push("/account") },
        ]);
      } else Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <Loading />;
  if (!product) return <Empty icon="alert-circle-outline">{t("product.notFound")}</Empty>;

  const inStock = product.stock > 0;
  const photos = product.images?.length ? product.images : product.image ? [product.image] : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: product.brands?.name || "",
          headerRight: () => (
            <Pressable onPress={() => toggle(product)} hitSlop={10} accessibilityLabel={liked ? t("product.removeFromWishlist") : t("product.addToWishlist")}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? c.pink : c.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((url) => (
            <View key={url} style={[s.imageBox, { width }]}>
              <Image source={{ uri: url }} style={{ width: "85%", height: "85%" }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        {photos.length > 1 && (
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 }}>
            {photos.map((url, i) => (
              <View key={url} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === photo ? c.primary : c.border }} />
            ))}
          </View>
        )}
        <View style={{ padding: 20 }}>
          <Text style={s.name}>{product.name}</Text>
          {rating ? <View style={{ marginTop: 6 }}><Stars value={rating.avg} count={rating.count} size={16} /></View> : null}
          <View style={{ marginTop: 8 }}><PriceTag product={product} size={28} /></View>
          {isOnSale(product) && product.sale_ends_at ? <View style={{ marginTop: 6 }}><Countdown until={product.sale_ends_at} /></View> : null}
          <Text style={{ marginTop: 6, fontWeight: "600", color: inStock ? c.success : c.danger }}>
            {inStock ? t("product.inStock", { count: product.stock }) : t("product.outOfStock")}
          </Text>
          {inStock && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "flex-start" }}>
              <Ionicons name="car-outline" size={18} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "700" }}>{t("product.delivery", deliveryRange(settings, i18n.language))}</Text>
                {Number(settings.shipping?.free_over) > 0 && (
                  <Text style={{ color: c.muted, fontSize: 13 }}>{t("product.freeShippingOver", { amount: money(settings.shipping.free_over) })}</Text>
                )}
              </View>
            </View>
          )}
          {product.categories?.name && <Text style={s.meta}>{t("product.category")}: {product.categories.name}</Text>}
          {product.sku && <Text style={s.meta}>{t("product.sku")}: {product.sku}</Text>}
          {product.description ? (
            <>
              <Text style={s.h2}>{t("product.description")}</Text>
              <Text style={s.desc}>{product.description}</Text>
            </>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <Reviews productId={product.id} />
          {similar.length > 0 && (
            <View>
              <Text style={[s.h2, { marginBottom: 12 }]}>{t("product.similar")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {similar.map((p) => <ProductCard key={p.id} product={p} style={{ width: "48%", marginBottom: 14 }} />)}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button title={inStock ? t("product.addToCart") : t("product.outOfStock")} onPress={handleAdd} loading={adding} disabled={!inStock} />
      </View>
    </View>
  );
}
