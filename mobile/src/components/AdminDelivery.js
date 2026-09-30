import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Linking, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/admin";
import { errorMessage } from "../lib/api";
import { Card, Button, useStyles } from "./ui";
import { orderAmountText, countryName, mapsUrl, flag } from "../../../shared/settings";

/** Admin side: country, payment and driver */
export default function AdminDelivery({ order, fields, onChange }) {
  const { t, i18n } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 4 },
    muted: { color: c.muted },
    text: { color: c.text },
    select: { flexDirection: "row", alignItems: "center", backgroundColor: c.input, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 13 },
    option: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  }));

  useEffect(() => {
    if (fields?.delivery) adminApi.drivers().then(setDrivers).catch(() => {});
  }, [fields?.delivery]);

  if (!fields?.delivery) return <Card><Text style={{ color: c.warning, fontSize: 13 }}>{t("delivery.needSql")}</Text></Card>;

  async function save(body) {
    setBusy(true);
    try {
      onChange(await adminApi.updateOrder(order.id, body));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  const cod = order.payment_method === "cod";
  const momo = order.payment_method === "momo";
  const paid = ["paid", "collected"].includes(order.payment_status);

  async function verify(decision) {
    const run = async () => {
      setBusy(true);
      try {
        onChange(await adminApi.verifyPayment(order.id, decision));
      } catch (e) {
        Alert.alert(t("common.error"), errorMessage(e, t));
      } finally {
        setBusy(false);
      }
    };
    if (decision === "reject") {
      Alert.alert(t("delivery.rejectPayment"), t("delivery.rejectConfirm"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("delivery.rejectPayment"), style: "destructive", onPress: run },
      ]);
    } else run();
  }
  const map = mapsUrl(order);
  const list = drivers.filter((d) => !d.country || !order.country || d.country === order.country);
  const current = drivers.find((d) => d.id === order.driver_id);

  return (
    <Card style={{ gap: 8 }}>
      <Text style={s.h2}>🛵 {t("delivery.title")}</Text>
      {order.country ? <Text style={s.text}>{flag(order.country)} {countryName(order.country, i18n.language)}</Text> : null}
      <Text style={s.muted}>{t("delivery.mode")}: <Text style={s.text}>{t(`delivery.modes.${order.delivery_mode || "carrier"}`)}</Text></Text>
      <Text style={s.text}>
        {cod ? "💵" : momo ? "📱" : "💳"} {t(`checkout.method.${order.payment_method || "card"}`)} ·{" "}
        <Text style={{ color: paid ? c.success : order.payment_status === "failed" ? c.danger : c.warning, fontWeight: "700" }}>
          {paid ? t("delivery.paid") : momo && order.payment_status === "pending" ? t("delivery.verifying") : order.payment_status === "failed" ? t("delivery.paymentFailed") : t("delivery.toPay", { amount: orderAmountText(order, i18n.language) })}
        </Text>
      </Text>
      {momo ? (
        <View style={{ borderWidth: 1, borderColor: order.payment_status === "pending" ? "#f97316" : c.border, borderRadius: 12, padding: 12, gap: 4 }}>
          <Text style={[s.text, { fontWeight: "700" }]}>📱 {t("delivery.momoCheck")}</Text>
          <Text style={s.muted}>{t("checkout.momo.operator")}: <Text style={s.text}>{order.payment_operator || "—"}</Text></Text>
          <Text style={s.muted}>{t("checkout.momo.reference")}: <Text style={[s.text, { fontWeight: "800" }]} selectable>{order.payment_reference || "—"}</Text></Text>
          <Text style={s.muted}>{t("checkout.momo.payerPhone")}: <Text style={s.text} selectable>{order.payer_phone || "—"}</Text></Text>
          <Text style={s.muted}>{t("delivery.amount")}: <Text style={[s.text, { fontWeight: "800" }]}>{orderAmountText(order, i18n.language)}</Text></Text>
          {order.payment_status === "pending" ? (
            <View style={{ gap: 8, marginTop: 6 }}>
              <Button title={`✓ ${t("delivery.confirmPayment")}`} onPress={() => verify("confirm")} loading={busy} />
              <Button title={t("delivery.rejectPayment")} variant="danger" onPress={() => verify("reject")} loading={busy} />
            </View>
          ) : null}
        </View>
      ) : null}
      {order.collected_method ? <Text style={s.muted}>{t(`delivery.collected.${order.collected_method}`)}</Text> : null}
      {order.delivery_code ? <Text style={s.muted}>{t("delivery.code")}: <Text style={[s.text, { fontWeight: "800", letterSpacing: 2 }]}>{order.delivery_code}</Text></Text> : null}
      {map ? <Button title={t("delivery.openMap")} icon="map-outline" variant="outline" onPress={() => Linking.openURL(map)} /> : null}

      <Text style={[s.muted, { marginTop: 6 }]}>{t("delivery.assignDriver")}</Text>
      <Pressable style={s.select} onPress={() => setPicking(true)} disabled={busy}>
        <Text style={{ color: c.text, flex: 1 }}>{current ? current.name || current.phone : order.driver_id ? "…" : t("delivery.noDriver")}</Text>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>
      {drivers.length === 0 ? <Text style={[s.muted, { fontSize: 12 }]}>{t("delivery.noDrivers")}</Text> : null}

      {order.delivery_status ? <Text style={s.muted}>{t("delivery.status")}: <Text style={[s.text, { fontWeight: "700" }]}>{t(`delivery.steps.${order.delivery_status}`)}</Text></Text> : null}
      {order.delivery_note ? <Text style={{ color: c.warning }}>{order.delivery_note}</Text> : null}
      {order.delivery_photo_url ? (
        <Pressable onPress={() => Linking.openURL(order.delivery_photo_url)}><Text style={{ color: c.primary }}>📷 {t("delivery.photo")}</Text></Pressable>
      ) : null}
      {cod && !paid ? <Button title={t("delivery.markCollected")} onPress={() => save({ payment_status: "collected" })} loading={busy} /> : null}

      <Modal visible={picking} transparent animationType="slide" onRequestClose={() => setPicking(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setPicking(false)} />
        <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}>
          <ScrollView style={{ maxHeight: 420 }}>
            {[{ id: "", name: t("delivery.noDriver") }, ...list].map((d) => (
              <Pressable key={d.id || "none"} style={s.option} onPress={() => { setPicking(false); save({ driver_id: d.id || null }); }}>
                <Text style={{ color: c.text, fontSize: 16 }}>{d.name || d.phone || d.id.slice(0, 8)}{d.country ? ` · ${flag(d.country)}` : ""}</Text>
                {(order.driver_id || "") === d.id ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Card>
  );
}
