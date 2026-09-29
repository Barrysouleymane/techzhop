import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWishlist } from "../store/wishlist";
import { useMoney } from "../lib/money";
import { useStyles } from "./ui";

export default function ProductCard({ product, style }) {
  const money = useMoney();
  const toggle = useWishlist((s) => s.toggle);
  const liked = useWishlist((s) => s.items.some((i) => i.id === product.id));
  const [s, c] = useStyles((c) => ({
    card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden", paddingBottom: 12 },
    imageBox: { backgroundColor: "#fff", height: 140, alignItems: "center", justifyContent: "center" },
    image: { width: "85%", height: "85%" },
    heart: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, padding: 6 },
    name: { color: c.text, fontWeight: "700", fontSize: 14, marginTop: 10, marginHorizontal: 10 },
    brand: { color: c.muted, fontSize: 12, marginTop: 2, marginHorizontal: 10 },
    price: { color: c.primary, fontWeight: "800", fontSize: 16, marginTop: 6, marginHorizontal: 10 },
  }));

  return (
    <Pressable style={StyleSheet.flatten([s.card, style])} onPress={() => router.push(`/product/${product.id}`)}>
      <View style={s.imageBox}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={s.image} resizeMode="contain" />
        ) : (
          <Ionicons name="image-outline" size={40} color="#999" />
        )}
        <Pressable onPress={() => toggle(product)} hitSlop={10} style={s.heart}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? c.pink : "#fff"} />
        </Pressable>
      </View>
      <Text style={s.name} numberOfLines={2}>{product.name}</Text>
      <Text style={s.brand} numberOfLines={1}>{product.brands?.name || product.categories?.name || " "}</Text>
      <Text style={s.price}>{money(product.price)}</Text>
    </Pressable>
  );
}
