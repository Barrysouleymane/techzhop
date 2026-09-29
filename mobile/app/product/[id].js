import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Alert, Pressable } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProduct, addToCart } from "../../src/lib/api";
import { useWishlist } from "../../src/store/wishlist";
import { Button, Loading, Empty } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const toggle = useWishlist((s) => s.toggle);
  const liked = useWishlist((s) => s.items.some((i) => String(i.id) === String(id)));

  useEffect(() => {
    getProduct(id).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function handleAdd() {
    setAdding(true);
    try {
      await addToCart(product.id);
      Alert.alert("Added to cart", product.name, [
        { text: "Keep shopping" },
        { text: "View cart", onPress: () => router.push("/cart") },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <Loading />;
  if (!product) return <Empty>Product not found.</Empty>;

  const inStock = product.stock > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: product.brands?.name || "",
          headerRight: () => (
            <Pressable onPress={() => toggle(product)} hitSlop={10}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? colors.pink : "#fff"} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.imageBox}>
          {product.image && <Image source={{ uri: product.image }} style={{ width: "85%", height: "85%" }} resizeMode="contain" />}
        </View>
        <View style={{ padding: 20 }}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
          <Text style={[styles.stock, { color: inStock ? colors.success : colors.danger }]}>
            {inStock ? `In stock (${product.stock})` : "Out of stock"}
          </Text>
          {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button title={inStock ? "Add to cart" : "Out of stock"} onPress={handleAdd} loading={adding} disabled={!inStock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageBox: { backgroundColor: "#fff", height: 320, alignItems: "center", justifyContent: "center" },
  name: { color: colors.text, fontSize: 24, fontWeight: "800" },
  price: { color: colors.primary, fontSize: 28, fontWeight: "800", marginTop: 8 },
  stock: { marginTop: 6, fontWeight: "600" },
  desc: { color: colors.muted, marginTop: 16, lineHeight: 22, fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
});
