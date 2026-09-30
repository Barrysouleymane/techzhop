import { View, Text, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Card, useStyles } from "./ui";
import { orderAmountText, DELIVERY_STEPS } from "../../../shared/settings";

/** Customer side: payment, amount to pay, delivery code, driver */
export default function DeliveryInfo({ order }) {
  const { t, i18n } = useTranslation();
  const [s, c] = useStyles((c) => ({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    codeBox: { borderWidth: 1, borderColor: c.primary, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 14 },
  }));
  if (!order.payment_method && !order.delivery_code) return null;

  const cod = order.payment_method === "cod";
  const paid = order.payment_status === "paid" || order.payment_status === "collected";
  const done = order.status === "delivered" || order.delivery_status === "delivered";
  const stepIndex = DELIVERY_STEPS.indexOf(order.delivery_status);

  return (
    <Card>
      <View style={s.row}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 }}>
          <Ionicons name={cod ? "cash-outline" : "card-outline"} size={18} color={cod ? c.success : c.primary} />
          <Text style={{ color: c.text, fontWeight: "700" }}>{t(`checkout.method.${cod ? "cod" : "card"}`)}</Text>
        </View>
        <Text style={{ color: paid ? c.success : c.warning, fontWeight: "700", flexShrink: 1, textAlign: "right" }}>
          {paid ? t("delivery.paid") : t("delivery.toPay", { amount: orderAmountText(order, i18n.language) })}
        </Text>
      </View>

      {order.delivery_code && !done && order.status !== "cancelled" ? (
        <View style={s.codeBox}>
          <Text style={{ color: c.muted, fontSize: 13 }}>🔑 {t("delivery.yourCode")}</Text>
          <Text style={{ color: c.text, fontSize: 36, fontWeight: "900", letterSpacing: 10, marginVertical: 4 }} selectable>{order.delivery_code}</Text>
          <Text style={{ color: c.muted, fontSize: 12, textAlign: "center" }}>{t("delivery.codeHelp")}</Text>
        </View>
      ) : null}

      {stepIndex >= 0 ? (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
          {DELIVERY_STEPS.map((st, i) => (
            <View key={st} style={{ flex: 1 }}>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: i <= stepIndex ? c.primary : c.border, marginBottom: 6 }} />
              <Text style={{ color: i <= stepIndex ? c.text : c.muted, fontSize: 11, textAlign: "center" }}>{t(`delivery.steps.${st}`)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {order.driver?.name ? (
        <View style={[s.row, { marginTop: 14, justifyContent: "flex-start" }]}>
          <Ionicons name="bicycle-outline" size={18} color={c.primary} />
          <Text style={{ color: c.text }}>{t("delivery.driver")}: <Text style={{ fontWeight: "700" }}>{order.driver.name}</Text></Text>
          {order.driver.phone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${order.driver.phone}`)} hitSlop={8}>
              <Ionicons name="call" size={18} color={c.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
