import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, Pressable, Alert, Linking, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../src/lib/admin";
import { errorMessage } from "../../src/lib/api";
import { Loading, Card, Button, Input, useStyles } from "../../src/components/ui";
import { StatusBadge, StatusTimeline } from "../../src/components/OrderStatus";
import { ORDER_STATUSES, CARRIERS, formatUSD, trackingUrl } from "../../../shared/settings";

export default function AdminOrder() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ carrier: "", tracking_number: "", admin_note: "" });
  const [saving, setSaving] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 10 },
    text: { color: c.text },
    muted: { color: c.muted },
    line: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
    thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    chip: { borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
    chipOn: { backgroundColor: c.primary, borderColor: c.primary },
  }));

  useEffect(() => {
    adminApi
      .order(id)
      .then((d) => {
        setData(d);
        setForm({ carrier: d.order.carrier || "", tracking_number: d.order.tracking_number || "", admin_note: d.order.admin_note || "" });
      })
      .catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)));
  }, [id, t]);

  async function save(fields) {
    setSaving(true);
    try {
      const order = await adminApi.updateOrder(id, fields);
      setData((d) => ({ ...d, order: { ...d.order, ...order } }));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  function chooseStatus() {
    Alert.alert(t("admin.changeStatus"), undefined, [
      ...ORDER_STATUSES.map((st) => ({ text: t(`orders.status.${st}`), onPress: () => save({ status: st }) })),
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  if (!data) return <Loading />;

  const { order, customer, payment, fields } = data;
  const usd = (n) => formatUSD(n, i18n.language);
  const next = { paid: "processing", processing: "shipped", shipped: "delivered" }[order.status];
  const link = trackingUrl(order.carrier, order.tracking_number);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: t("orders.order", { id: order.id }) }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={[s.line, { justifyContent: "space-between", marginBottom: 12 }]}>
            <Text style={s.muted}>{new Date(order.created_at).toLocaleString(i18n.language)}</Text>
            <Pressable onPress={chooseStatus} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <StatusBadge status={order.status} />
              <Ionicons name="chevron-down" size={16} color={c.muted} />
            </Pressable>
          </View>
          <StatusTimeline status={order.status} />
          {next && (
            <Button title={t("admin.markAs", { status: t(`orders.status.${next}`) })} onPress={() => save({ status: next })} loading={saving} style={{ marginTop: 16 }} />
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={s.h2}>{t("orders.tracking")}</Text>
          {fields.carrier ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {CARRIERS.map((cr) => {
                const on = form.carrier === cr.code;
                return (
                  <Pressable key={cr.code} onPress={() => setForm({ ...form, carrier: cr.code })} style={[s.chip, on && s.chipOn]}>
                    <Text style={{ color: on ? c.onPrimary : c.text }}>{cr.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: c.warning, fontSize: 12 }}>{t("admin.needSql")}</Text>
          )}
          <Input label={t("orders.trackingNumber")} value={form.tracking_number} onChangeText={(v) => setForm({ ...form, tracking_number: v })} autoCapitalize="characters" autoCorrect={false} />
          <Button
            title={t("admin.saveTracking")}
            loading={saving}
            onPress={() =>
              save({
                tracking_number: form.tracking_number,
                ...(fields.carrier ? { carrier: form.carrier } : {}),
                ...(["paid", "processing"].includes(order.status) && form.tracking_number ? { status: "shipped" } : {}),
              })
            }
          />
          {link && <Button title={t("orders.trackPackage")} variant="outline" icon="open-outline" onPress={() => Linking.openURL(link)} />}
        </Card>

        <Card>
          <Text style={s.h2}>{t("orders.items")}</Text>
          {(order.order_items || []).map((it) => (
            <View key={it.id} style={s.line}>
              <View style={s.thumb}>{it.image ? <Image source={{ uri: it.image }} style={{ width: "90%", height: "90%" }} resizeMode="contain" /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "600" }]} numberOfLines={2}>{it.product_name}</Text>
                <Text style={s.muted}>{usd(it.price)} × {it.quantity}</Text>
              </View>
              <Text style={s.text}>{usd(Number(it.price) * it.quantity)}</Text>
            </View>
          ))}
          <View style={[s.line, { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.border, marginTop: 8, paddingTop: 10 }]}>
            <Text style={[s.text, { fontWeight: "800" }]}>{t("orders.total")}</Text>
            <Text style={{ color: c.primary, fontWeight: "800" }}>{usd(order.total)}</Text>
          </View>
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={s.h2}>{t("admin.customer")}</Text>
          <View style={s.line}><Ionicons name="person-outline" size={18} color={c.primary} /><Text style={s.text}>{customer?.name || t("admin.guest")}</Text></View>
          {customer?.email ? (
            <Pressable style={s.line} onPress={() => Linking.openURL(`mailto:${customer.email}`)}>
              <Ionicons name="mail-outline" size={18} color={c.primary} /><Text style={[s.text, { flexShrink: 1 }]}>{customer.email}</Text>
            </Pressable>
          ) : null}
          {customer?.phone ? (
            <Pressable style={s.line} onPress={() => Linking.openURL(`tel:${customer.phone}`)}>
              <Ionicons name="call-outline" size={18} color={c.primary} /><Text style={s.text}>{customer.phone}</Text>
            </Pressable>
          ) : null}
          {order.shipping_address ? (
            <View style={[s.line, { alignItems: "flex-start" }]}>
              <Ionicons name="location-outline" size={18} color={c.primary} /><Text style={[s.muted, { flex: 1 }]}>{order.shipping_address}</Text>
            </View>
          ) : null}
        </Card>

        {payment && (
          <Card style={{ gap: 6 }}>
            <Text style={s.h2}>{t("admin.payment")}</Text>
            <Text style={s.text}>{usd(payment.amount)} · <Text style={{ color: c.success }}>{payment.status}</Text></Text>
            {payment.email ? <Text style={s.muted}>{payment.email}</Text> : null}
            {payment.dashboard_url ? (
              <Pressable onPress={() => Linking.openURL(payment.dashboard_url)}>
                <Text style={{ color: c.primary }}>{t("admin.viewInStripe")} ↗</Text>
              </Pressable>
            ) : null}
          </Card>
        )}

        {fields.note && (
          <Card style={{ gap: 10 }}>
            <Text style={s.h2}>{t("admin.internalNote")}</Text>
            <Input value={form.admin_note} onChangeText={(v) => setForm({ ...form, admin_note: v })} placeholder={t("admin.notePlaceholder")} multiline style={{ minHeight: 90, textAlignVertical: "top" }} />
            <Button title={t("common.save")} variant="outline" onPress={() => save({ admin_note: form.admin_note })} loading={saving} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
