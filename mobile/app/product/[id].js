import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, Alert, Pressable } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getProduct, addToCart, errorMessage } from "../../src/lib/api";
import { useWishlist } from "../../src/store/wishlist";
import { useMoney } from "../../src/lib/money";
import { Button, Loading, Empty, useStyles } from "../../src/components/ui";

export default function ProductDetails() {
  const { t } = useTranslation();
  const money = useMoney();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
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
    getProduct(id).then(setProduct).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

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
        <View style={s.imageBox}>
          {product.image && <Image source={{ uri: product.image }} style={{ width: "85%", height: "85%" }} resizeMode="contain" />}
        </View>
        <View style={{ padding: 20 }}>
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.price}>{money(product.price)}</Text>
          <Text style={{ marginTop: 6, fontWeight: "600", color: inStock ? c.success : c.danger }}>
            {inStock ? t("product.inStock", { count: product.stock }) : t("product.outOfStock")}
          </Text>
          {product.categories?.name && <Text style={s.meta}>{t("product.category")}: {product.categories.name}</Text>}
          {product.sku && <Text style={s.meta}>{t("product.sku")}: {product.sku}</Text>}
          {product.description ? (
            <>
              <Text style={s.h2}>{t("product.description")}</Text>
              <Text style={s.desc}>{product.description}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button title={inStock ? t("product.addToCart") : t("product.outOfStock")} onPress={handleAdd} loading={adding} disabled={!inStock} />
      </View>
    </View>
  );
}
