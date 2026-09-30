import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, Alert, Linking, RefreshControl, TextInput, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { getDeliveries, updateDelivery, errorMessage } from "../../src/lib/api";
import { Button, Card, Empty, Loading, Toggle, useStyles } from "../../src/components/ui";
import { mapsUrl, phoneDigits, orderAmountText, DELIVERY_STEPS } from "../../../shared/settings";

function DeliveryCard({ d, onChange }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [collected, setCollected] = useState(false);
  const [method, setMethod] = useState("cash");
  const [photo, setPhoto] = useState(null);
  const [s, c] = useStyles((c) => ({
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    actions: { flexDirection: "row", gap: 8, marginVertical: 10 },
    small: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingVertical: 10 },
    code: { backgroundColor: c.input, color: c.text, borderRadius: 12, borderWidth: 1, borderColor: c.border, fontSize: 28, letterSpacing: 12, textAlign: "center", paddingVertical: 10, fontWeight: "800" },
    chip: { borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  }));

  const cod = d.payment_method === "cod" && d.payment_status !== "collected";
  const done = d.delivery_status === "delivered";
  const step = DELIVERY_STEPS.indexOf(d.delivery_status);
  const map = mapsUrl(d);
  const tel = d.customer_phone;

  async function act(body, ok) {
    setBusy(true);
    try {
      onChange(await updateDelivery(d.id, body));
      if (ok) Alert.alert(ok);
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    if (!res.canceled && res.assets?.[0]?.base64) setPhoto(res.assets[0].base64);
  }

  function problem() {
    Platform.OS === "ios"
      ? Alert.prompt(t("driver.problem"), t("driver.problemPrompt"), (note) => note && act({ action: "failed", note }))
      : act({ action: "failed", note: t("driver.problem") });
  }

  const badgeColor = done ? c.success : d.delivery_status === "failed" ? c.danger : c.primary;

  return (
    <Card style={{ marginBottom: 14, opacity: done ? 0.7 : 1 }}>
      <View style={s.head}>
        <Text style={{ color: c.text, fontWeight: "800", fontSize: 17 }}>#{d.id}</Text>
        <View style={[s.badge, { backgroundColor: badgeColor + "33" }]}>
          <Text style={{ color: badgeColor, fontWeight: "700", fontSize: 12 }}>{t(`delivery.steps.${d.delivery_status || "assigned"}`)}</Text>
        </View>
      </View>
      <Text style={{ color: c.text }} selectable>{d.shipping_address}</Text>

      <View style={s.actions}>
        {tel ? (
          <Pressable style={s.small} onPress={() => Linking.openURL(`tel:${tel}`)}><Ionicons name="call" size={16} color={c.primary} /><Text style={{ color: c.text }}>{t("driver.call")}</Text></Pressable>
        ) : null}
        {tel ? (
          <Pressable style={s.small} onPress={() => Linking.openURL(`https://wa.me/${phoneDigits(tel)}`)}><Ionicons name="logo-whatsapp" size={16} color="#22c55e" /><Text style={{ color: c.text }}>WhatsApp</Text></Pressable>
        ) : null}
        {map ? (
          <Pressable style={s.small} onPress={() => Linking.openURL(map)}><Ionicons name="navigate" size={16} color={c.primary} /><Text style={{ color: c.text }}>{t("driver.map")}</Text></Pressable>
        ) : null}
      </View>

      {(d.order_items || []).map((i) => (
        <Text key={i.id} style={{ color: c.muted }}>📦 {i.product_name} × {i.quantity}</Text>
      ))}

      {d.payment_method === "cod" ? (
        <Text style={{ color: cod ? c.warning : c.success, fontWeight: "800", marginTop: 8 }}>
          💵 {cod ? t("driver.collect", { amount: orderAmountText(d, i18n.language) }) : t("delivery.paid")}
        </Text>
      ) : null}

      {!done ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {step <= 0 ? <Button title={`📦 ${t("driver.pickedUp")}`} onPress={() => act({ action: "picked_up" })} loading={busy} /> : null}
          {step === 1 ? <Button title={`🛵 ${t("driver.outForDelivery")}`} onPress={() => act({ action: "out_for_delivery" }, t("driver.customerNotified"))} loading={busy} /> : null}
          {step === 2 || d.delivery_status === "failed" ? (
            <View style={{ gap: 10 }}>
              {d.needs_code ? (
                <>
                  <Text style={{ color: c.muted }}>{t("driver.askCode")}</Text>
                  <TextInput value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor={c.muted} style={s.code} />
                </>
              ) : null}
              {cod ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <Text style={{ color: c.text, flex: 1 }}>{t("driver.collectedConfirm", { amount: orderAmountText(d, i18n.language) })}</Text>
                    <Toggle value={collected} onValueChange={setCollected} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {["cash", "mobile_money"].map((m) => (
                      <Pressable key={m} onPress={() => setMethod(m)} style={[s.chip, method === m && { borderColor: c.primary, backgroundColor: c.primary }]}>
                        <Text style={{ color: method === m ? c.onPrimary : c.text }}>{t(`delivery.collected.${m}`)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
              <Button title={photo ? `✓ ${t("driver.photoReady")}` : t("driver.takePhoto")} icon="camera-outline" variant="outline" onPress={takePhoto} />
              <Button
                title={t("driver.confirmDelivered")}
                onPress={() => act({ action: "delivered", code, collected: cod ? collected : undefined, collected_method: method, photo: photo || undefined }, t("driver.deliveredOk"))}
                loading={busy}
                disabled={(d.needs_code && code.length !== 4) || (cod && !collected)}
              />
            </View>
          ) : null}
          <Pressable onPress={problem} hitSlop={8}><Text style={{ color: c.danger }}>⚠️ {t("driver.problem")}</Text></Pressable>
          {d.delivery_note ? <Text style={{ color: c.warning }}>{d.delivery_note}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function Deliveries() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, c] = useStyles(() => ({}));

  const load = useCallback(async () => {
    try {
      setList(await getDeliveries());
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
      setList([]);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!list) return <Loading />;

  const replace = (d) => setList((l) => l.map((x) => (x.id === d.id ? d : x)));
  const active = list.filter((d) => d.delivery_status !== "delivered" && d.status !== "cancelled");
  const done = list.filter((d) => d.delivery_status === "delivered").slice(0, 20);

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={[...active, ...done]}
      keyExtractor={(d) => String(d.id)}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={c.primary} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      ListEmptyComponent={<Empty icon="bicycle-outline">{t("driver.none")}</Empty>}
      renderItem={({ item, index }) => (
        <>
          {index === active.length && done.length ? <Text style={{ color: c.muted, fontWeight: "700", marginBottom: 10 }}>{t("driver.done", { count: done.length })}</Text> : null}
          <DeliveryCard d={item} onChange={replace} />
        </>
      )}
    />
  );
}
