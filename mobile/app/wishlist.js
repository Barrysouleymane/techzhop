import { FlatList } from "react-native";
import { useWishlist } from "../src/store/wishlist";
import ProductCard from "../src/components/ProductCard";
import { Empty } from "../src/components/ui";
import { colors } from "../src/theme";

export default function Wishlist() {
  const items = useWishlist((s) => s.items);
  return (
    <FlatList
      data={items}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => <ProductCard product={item} style={{ width: "48%", marginBottom: 14 }} />}
      ListEmptyComponent={<Empty>Your wishlist is empty.{"\n"}Tap the ♥ on a product to save it.</Empty>}
    />
  );
}
