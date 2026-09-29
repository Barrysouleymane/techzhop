import { FlatList } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../src/store/wishlist";
import ProductCard from "../src/components/ProductCard";
import { Empty, Button } from "../src/components/ui";
import { useColors } from "../src/theme";

export default function Wishlist() {
  const { t } = useTranslation();
  const c = useColors();
  const items = useWishlist((s) => s.items);

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => String(p.id)}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      renderItem={({ item }) => <ProductCard product={item} style={{ width: "48%", marginBottom: 14 }} />}
      ListEmptyComponent={
        <Empty icon="heart-outline" action={<Button title={t("wishlist.browse")} onPress={() => router.push("/products")} />}>
          {t("wishlist.empty")}{"\n"}{t("wishlist.hint")}
        </Empty>
      }
    />
  );
}
