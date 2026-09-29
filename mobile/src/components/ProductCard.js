import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useWishlist } from "../store/wishlist";

export default function ProductCard({ product, style }) {
  const toggle = useWishlist((s) => s.toggle);
  const liked = useWishlist((s) => s.items.some((i) => i.id === product.id));

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={[styles.card, style]}>
        <View style={styles.imageBox}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          ) : (
            <Ionicons name="image-outline" size={40} color="#999" />
          )}
          <Pressable
            onPress={(e) => {
              e.preventDefault?.();
              toggle(product);
            }}
            hitSlop={10}
            style={styles.heart}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? colors.pink : "#fff"}
            />
          </Pressable>
        </View>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brands?.name || product.categories?.name || " "}
        </Text>
        <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    paddingBottom: 12,
  },
  imageBox: {
    backgroundColor: "#fff",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "85%", height: "85%" },
  heart: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    padding: 6,
  },
  name: { color: colors.text, fontWeight: "700", fontSize: 14, marginTop: 10, marginHorizontal: 10 },
  brand: { color: colors.muted, fontSize: 12, marginTop: 2, marginHorizontal: 10 },
  price: { color: colors.primary, fontWeight: "800", fontSize: 16, marginTop: 6, marginHorizontal: 10 },
});
