import { useCallback, useState } from "react";
import { View, Text, FlatList, Image, Pressable, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getCart, setQuantity, removeFromCart, createCheckoutSession, getAddresses, errorMessage } from "../../src/lib/api";
import useAuth from "../../src/lib/useAuth";
import { useMoney, useCurrency } from "../../src/lib/money";
import { Button, Loading, Empty, useStyles } from "../../src/components/ui";
import { formatAddress, formatUSD } from "../../../shared/settings";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const currency = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [s, c] = useStyles((c) => ({
    row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: c.border },
    thumb: { width: 70, height: 70, backgroundColor: "#fff", borderRadius: 10, alignItems: "center", justifyContent: "center" },
    name: { color: c.text, fontWeight: "700" },
    price: { color: c.primary, fontWeight: "800", marginTop: 4 },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    qtyBtn: { backgroundColor: c.border, borderRadius: 8, padding: 6 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 10, backgroundColor: c.bg },
    totalRow: { flexDirection: "row", justifyContent: "space-between" },
    address: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border },
  }));

  const load = useCallback(async () => {
    try {
      setCart(await getCart());
      if (user) {
        const list = await getAddresses(user.id).catch(() => []);
        setAddress(list.find((a) => a.is_default) || list[0] || null);
      }
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function changeQty(item, delta) {
    await setQuantity(item.id, item.quantity + delta);
    load();
  }

  async function checkout() {
    setPaying(true);
    try {
      const { url } = await createCheckoutSession(cart, formatAddress(address));
      if (!url) throw new Error(t("checkout.failed"));
      await WebBrowser.openBrowserAsync(url);
      load(); // the Stripe webhook empties the cart after payment
    } catch (e) {
      Alert.alert(t("checkout.failed"), errorMessage(e, t));
    } finally {
      setPaying(false);
    }
  }

  if (authLoading || loading) return <Loading />;

  if (!user) {
    return <Empty icon="cart-outline" action={<Button title={t("auth.login")} onPress={() => router.push("/account")} style={{ alignSelf: "stretch" }} />}>{t("cart.loginToSee")}</Empty>;
  }

  const total = cart.reduce((sum, i) => sum + Number(i.products?.price || 0) * i.quantity, 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={cart}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={<Empty icon="cart-outline" action={<Button title={t("cart.continueShopping")} onPress={() => router.push("/products")} />}>{t("cart.empty")}</Empty>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Pressable style={s.thumb} onPress={() => router.push(`/product/${item.product_id}`)}>
              {item.products?.image && <Image source={{ uri: item.products.image }} style={{ width: "85%", height: "85%" }} resizeMode="contain" />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={2}>{item.products?.name}</Text>
              <Text style={s.price}>{money(item.products?.price)}</Text>
              <View style={s.qtyRow}>
                <Pressable onPress={() => changeQty(item, -1)} style={s.qtyBtn}><Ionicons name="remove" size={16} color={c.text} /></Pressable>
                <Text style={{ color: c.text, minWidth: 24, textAlign: "center" }}>{item.quantity}</Text>
                <Pressable onPress={() => changeQty(item, 1)} style={s.qtyBtn}><Ionicons name="add" size={16} color={c.text} /></Pressable>
              </View>
            </View>
            <Pressable onPress={async () => { await removeFromCart(item.id); load(); }} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={c.danger} />
            </Pressable>
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={s.footer}>
          <Pressable style={s.address} onPress={() => router.push("/addresses")}>
            <Ionicons name="location-outline" size={20} color={c.primary} />
            <Text style={{ color: address ? c.text : c.primary, flex: 1 }} numberOfLines={2}>
              {address ? `${t("checkout.shipTo")}: ${formatAddress(address)}` : t("checkout.addAddress")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
          <View style={s.totalRow}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "700" }}>{t("cart.total")}</Text>
            <Text style={{ color: c.primary, fontSize: 22, fontWeight: "800" }}>{money(total)}</Text>
          </View>
          {currency !== "USD" && (
            <Text style={{ color: c.muted, fontSize: 12 }}>{t("checkout.chargedInUsd", { amount: formatUSD(total, i18n.language) })}</Text>
          )}
          <Button title={t("checkout.pay")} onPress={checkout} loading={paying} />
        </View>
      )}
    </View>
  );
}
