import { useCallback, useState } from "react";
import { View, Text, FlatList, Image, Pressable, Alert, TextInput } from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getCart, setQuantity, removeFromCart, createCheckoutSession, confirmCheckout, placeCodOrder, placeMomoOrder, errorMessage } from "../../src/lib/api";
import useAuth from "../../src/lib/useAuth";
import { useMoney, useCurrency } from "../../src/lib/money";
import { Button, Loading, Empty, useStyles } from "../../src/components/ui";
import { formatAddress, formatUSD, effectivePrice, quote, countryCfg, normalizeCountry, countryName, localAmount, formatLocal, isLocalDelivery, needsLandmark, momoAccounts } from "../../../shared/settings";
import { useShop } from "../../src/store/shop";
import { PriceTag } from "../../src/components/Shop";
import { useLocation, useDeliveryLocation } from "../../src/store/location";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const currency = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const loc = useDeliveryLocation();
  const address = loc.address;
  const openLocation = useLocation((st) => st.setOpen);
  const savedCount = useLocation((st) => st.addresses.length);
  const loadAddresses = useLocation((st) => st.loadAddresses);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState(null);
  const [momo, setMomo] = useState({ operator: "", reference: "", payer_phone: "" });
  const settings = useShop((st) => st.settings);
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
    momo: { borderWidth: 1, borderColor: "#f9731666", borderRadius: 14, padding: 12, gap: 8 },
    opChip: { borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
    number: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.input, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 12 },
    momoInput: { backgroundColor: c.input, color: c.text, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
    method: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  }));

  const load = useCallback(async () => {
    try {
      setCart(await getCart());
      if (user) loadAddresses(user.id);
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, [user, t, loadAddresses]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function changeQty(item, delta) {
    await setQuantity(item.id, item.quantity + delta);
    load();
  }

  async function placeMomo() {
    setPaying(true);
    try {
      const res = await placeMomoOrder(cart, address.id, { operator: account?.name, reference: momo.reference.trim(), payer_phone: momo.payer_phone || address.phone });
      setMomo({ operator: "", reference: "", payer_phone: "" });
      await load();
      Alert.alert(t("checkout.momo.placed"), undefined, [
        { text: t("orders.viewDetails"), onPress: () => router.push(`/orders/${res.order_id}`) },
      ]);
    } catch (e) {
      Alert.alert(t("checkout.failed"), errorMessage(e, t));
    } finally {
      setPaying(false);
    }
  }

  async function placeCod() {
    setPaying(true);
    try {
      const res = await placeCodOrder(cart, address.id);
      await load();
      Alert.alert(t("checkout.codPlaced"), undefined, [
        { text: t("orders.viewDetails"), onPress: () => router.push(`/orders/${res.order_id}`) },
      ]);
    } catch (e) {
      Alert.alert(t("checkout.failed"), errorMessage(e, t));
    } finally {
      setPaying(false);
    }
  }

  async function checkout() {
    setPaying(true);
    try {
      const { url, id } = await createCheckoutSession(cart, formatAddress(address), address);
      if (!url) throw new Error(t("checkout.failed"));
      await WebBrowser.openBrowserAsync(url);
      // Back from the payment page: save the order if it was paid
      const orderId = id ? await confirmCheckout(id).catch(() => null) : null;
      await load();
      if (orderId) {
        Alert.alert(t("success.title"), t("success.thanks"), [
          { text: t("orders.viewDetails"), onPress: () => router.push(`/orders/${orderId}`) },
        ]);
      }
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

  const subtotal = cart.reduce((sum, i) => sum + effectivePrice(i.products) * i.quantity, 0);
  const q = quote(settings, subtotal, loc);
  const country = normalizeCountry(address?.country || loc.country);
  const cfg = countryCfg(settings, country);
  const accounts = momoAccounts(cfg);
  const methods = address ? (cfg?.payments || []).filter((m) => m !== "momo" || accounts.length > 0) : [];
  const account = accounts.find((a) => a.name === momo.operator) || accounts[0];
  const payWith = methods.includes(method) ? method : methods[0] || null;
  const due = cfg && cfg.currency !== "USD" ? formatLocal(localAmount(cfg, q.total), cfg.currency, i18n.language) : null;
  const missingPhone = address && needsLandmark(country) && !address.phone;

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
              <View style={{ marginTop: 4 }}><PriceTag product={item.products} size={15} /></View>
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
          <Pressable style={s.address} onPress={() => (savedCount ? openLocation(true) : router.push("/addresses/edit"))}>
            <Ionicons name="location-outline" size={20} color={c.primary} />
            <Text style={{ color: address ? c.text : c.primary, flex: 1 }} numberOfLines={2}>
              {address ? `${t("checkout.shipTo")}: ${formatAddress(address)}` : savedCount ? t("location.title") : t("checkout.addAddress")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
          <View style={s.totalRow}>
            <Text style={{ color: c.muted }}>{t("cart.subtotalLabel")}</Text>
            <Text style={{ color: c.text }}>{money(q.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={{ color: c.muted }}>{t("cart.shipping")}</Text>
            <Text style={{ color: q.shipping === 0 ? c.success : c.text }}>{q.shipping === 0 ? t("cart.free") : money(q.shipping)}</Text>
          </View>
          {q.tax > 0 && (
            <View style={s.totalRow}>
              <Text style={{ color: c.muted }}>{t("cart.tax")} ({q.taxRate}%)</Text>
              <Text style={{ color: c.text }}>{money(q.tax)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "700" }}>{t("cart.total")}</Text>
            <Text style={{ color: c.primary, fontSize: 22, fontWeight: "800" }}>{money(q.total)}</Text>
          </View>
          {currency !== "USD" && payWith !== "cod" && (
            <Text style={{ color: c.muted, fontSize: 12 }}>{t("checkout.chargedInUsd", { amount: formatUSD(q.total, i18n.language) })}</Text>
          )}
          <Text style={{ color: c.muted, fontSize: 12 }}>🏷️ {t("cart.promoNote")}</Text>
          {address && !cfg ? (
            <Text style={{ color: c.warning }}>⚠️ {t("checkout.notDelivered", { country: countryName(country, i18n.language) })}</Text>
          ) : null}
          {methods.length > 1 ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {methods.map((m) => (
                <Pressable key={m} onPress={() => setMethod(m)} style={[s.method, payWith === m && { borderColor: c.primary, backgroundColor: c.card }]}>
                  <Ionicons name={m === "card" ? "card-outline" : m === "momo" ? "phone-portrait-outline" : "cash-outline"} size={18} color={payWith === m ? c.primary : c.muted} />
                  <Text style={{ color: c.text, fontWeight: payWith === m ? "700" : "400", flexShrink: 1 }} numberOfLines={1}>{t(`checkout.method.${m}`)}</Text>
                </Pressable>
              ))}
            </View>
          ) : payWith ? (
            <Text style={{ color: c.muted, fontSize: 13 }}>{payWith === "cod" ? "💵" : payWith === "momo" ? "📱" : "💳"} {t(`checkout.method.${payWith}`)} — {t(`checkout.methodHint.${payWith}`)}</Text>
          ) : null}
          {address && isLocalDelivery(settings, address) ? <Text style={{ color: c.success, fontSize: 13 }}>🛵 {t("checkout.localDelivery")}</Text> : null}
          {payWith === "momo" && account ? (
            <View style={s.momo}>
              {accounts.length > 1 ? (
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {accounts.map((a) => (
                    <Pressable key={a.name} onPress={() => setMomo({ ...momo, operator: a.name })} style={[s.opChip, account.name === a.name && { borderColor: "#f97316", backgroundColor: "#f9731633" }]}>
                      <Text style={{ color: c.text, fontWeight: account.name === a.name ? "700" : "400" }}>{a.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={{ color: c.text, fontSize: 13 }}>1. {t("checkout.momo.step1", { amount: due || "", operator: account.name })}</Text>
              <View style={s.number}>
                <Text selectable style={{ color: c.text, fontSize: 18, fontWeight: "800", letterSpacing: 1 }}>{account.number}</Text>
                <Ionicons name="phone-portrait-outline" size={18} color={c.primary} />
              </View>
              {cfg.momo?.holder ? <Text style={{ color: c.muted, fontSize: 12 }}>{t("checkout.momo.holder")}: {cfg.momo.holder}</Text> : null}
              <Text style={{ color: c.text, fontSize: 13 }}>2. {t("checkout.momo.step2")}</Text>
              <TextInput value={momo.reference} onChangeText={(v) => setMomo({ ...momo, reference: v })} placeholder={t("checkout.momo.reference")} placeholderTextColor={c.muted} autoCapitalize="characters" style={s.momoInput} />
              <TextInput value={momo.payer_phone} onChangeText={(v) => setMomo({ ...momo, payer_phone: v })} placeholder={`${t("checkout.momo.payerPhone")} (${address?.phone || ""})`} placeholderTextColor={c.muted} keyboardType="phone-pad" style={s.momoInput} />
            </View>
          ) : null}
          {payWith === "cod" && due ? (
            <Text style={{ color: c.text, fontSize: 16 }}>💵 {t("checkout.toPayOnDelivery")}: <Text style={{ color: c.success, fontWeight: "800" }}>{due}</Text></Text>
          ) : null}
          {missingPhone ? <Text style={{ color: c.warning, fontSize: 13 }}>{t("checkout.phoneNeeded")}</Text> : null}
          <Button
            title={payWith === "cod" ? t("checkout.placeOrder") : payWith === "momo" ? t("checkout.momo.confirm") : t("checkout.pay")}
            onPress={payWith === "cod" ? placeCod : payWith === "momo" ? placeMomo : checkout}
            loading={paying}
            disabled={!address || !cfg || !payWith || (payWith !== "card" && missingPhone) || (payWith === "momo" && momo.reference.trim().length < 4)}
          />
        </View>
      )}
    </View>
  );
}
