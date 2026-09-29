import { useEffect, useState } from "react";
import { ScrollView, View, Text, Linking } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getOrder, errorMessage } from "../../src/lib/api";
import { Loading, Empty, Card, Button, useStyles } from "../../src/components/ui";
import { StatusBadge, StatusTimeline } from "../../src/components/OrderStatus";
import { formatUSD, carrierName, trackingUrl } from "../../../shared/settings";

export default function OrderDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontWeight: "800", fontSize: 16, marginBottom: 12 },
    line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, gap: 12 },
    text: { color: c.text },
    muted: { color: c.muted },
  }));

  useEffect(() => {
    getOrder(id).then(setOrder).catch((e) => setError(errorMessage(e, t)));
  }, [id, t]);

  if (error) return <Empty icon="alert-circle-outline">{error}</Empty>;
  if (!order) return <Loading />;

  const usd = (n) => formatUSD(n, i18n.language);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Stack.Screen options={{ title: t("orders.order", { id: order.id }) }} />

      <Card>
        <View style={[s.line, { marginBottom: 16 }]}>
          <Text style={s.muted}>{new Date(order.created_at).toLocaleString(i18n.language)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={s.h2}>{t("orders.tracking")}</Text>
        <StatusTimeline status={order.status} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 }}>
          <Ionicons name="cube-outline" size={18} color={c.primary} />
          <Text style={s.muted}>{t("orders.trackingNumber")}: </Text>
          <Text style={[s.text, { fontWeight: "700", flexShrink: 1 }]} selectable>{order.tracking_number || t("orders.noTracking")}</Text>
        </View>
        {order.carrier ? <Text style={[s.muted, { marginTop: 4 }]}>{t("orders.carrier")}: {carrierName(order.carrier)}</Text> : null}
        {trackingUrl(order.carrier, order.tracking_number) ? (
          <Button title={t("orders.trackPackage")} icon="open-outline" onPress={() => Linking.openURL(trackingUrl(order.carrier, order.tracking_number))} style={{ marginTop: 14 }} />
        ) : null}
      </Card>

      {order.shipping_address ? (
        <Card>
          <Text style={s.h2}>{t("checkout.shipTo")}</Text>
          <Text style={s.muted}>{order.shipping_address}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={s.h2}>{t("orders.items")}</Text>
        {(order.order_items || []).map((it) => (
          <View key={it.id} style={s.line}>
            <Text style={[s.text, { flex: 1 }]} numberOfLines={2}>{it.product_name} × {it.quantity}</Text>
            <Text style={s.text}>{usd(Number(it.price) * it.quantity)}</Text>
          </View>
        ))}
        <View style={[s.line, { borderTopWidth: 1, borderTopColor: c.border, marginTop: 8, paddingTop: 10 }]}>
          <Text style={[s.text, { fontWeight: "800" }]}>{t("orders.total")}</Text>
          <Text style={{ color: c.primary, fontWeight: "800" }}>{usd(order.total)}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
