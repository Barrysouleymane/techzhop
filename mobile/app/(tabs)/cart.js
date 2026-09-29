import { useCallback, useState } from "react";
import { View, Text, FlatList, Image, Pressable, StyleSheet, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { getCart, setQuantity, removeFromCart, createCheckoutSession } from "../../src/lib/api";
import useAuth from "../../src/lib/useAuth";
import { Button, Loading, Empty } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      setCart(await getCart());
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab is opened
  useFocusEffect(useCallback(() => { load(); }, [load, user]));

  async function changeQty(item, delta) {
    await setQuantity(item.id, item.quantity + delta);
    load();
  }

  async function checkout() {
    setPaying(true);
    try {
      const { url } = await createCheckoutSession(cart);
      if (!url) throw new Error("Stripe Checkout URL is missing.");
      await WebBrowser.openBrowserAsync(url);
      // The Stripe webhook empties the cart once payment succeeds
      load();
    } catch (e) {
      Alert.alert("Checkout failed", e.message);
    } finally {
      setPaying(false);
    }
  }

  if (authLoading || loading) return <Loading />;

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={56} color={colors.muted} />
        <Text style={styles.muted}>Log in to see your cart.</Text>
        <Button title="Log in" onPress={() => router.push("/account")} style={{ marginTop: 16, alignSelf: "stretch" }} />
      </View>
    );
  }

  const total = cart.reduce((t, i) => t + Number(i.products?.price || 0) * i.quantity, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={cart}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={<Empty>Your cart is empty.</Empty>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.thumb}>
              {item.products?.image && (
                <Image source={{ uri: item.products.image }} style={{ width: "85%", height: "85%" }} resizeMode="contain" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>{item.products?.name}</Text>
              <Text style={styles.price}>${Number(item.products?.price || 0).toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => changeQty(item, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color="#fff" /></Pressable>
                <Text style={{ color: "#fff", minWidth: 24, textAlign: "center" }}>{item.quantity}</Text>
                <Pressable onPress={() => changeQty(item, 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color="#fff" /></Pressable>
              </View>
            </View>
            <Pressable onPress={async () => { await removeFromCart(item.id); load(); }} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
          <Button title="Checkout" onPress={checkout} loading={paying} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  muted: { color: colors.muted, marginTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 12 },
  thumb: { width: 70, height: 70, backgroundColor: "#fff", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { color: colors.text, fontWeight: "700" },
  price: { color: colors.primary, fontWeight: "800", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  qtyBtn: { backgroundColor: colors.border, borderRadius: 8, padding: 6 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: colors.text, fontSize: 18, fontWeight: "700" },
  totalValue: { color: colors.primary, fontSize: 22, fontWeight: "800" },
});
