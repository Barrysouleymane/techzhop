import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { requestOrderHelp, errorMessage } from "../lib/api";
import { Card, Button, Input, useStyles } from "./ui";
import { formatUSD } from "../../../shared/settings";

const REASONS = ["changedMind", "damaged", "wrongItem", "late", "other"];

/** Customer side: cancel / return request, its status, refunds */
export default function OrderHelp({ order, onChange }) {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontWeight: "800", fontSize: 16, marginBottom: 10 },
    chip: { borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
    chipOn: { borderColor: c.primary, backgroundColor: c.primary },
    box: { backgroundColor: c.bg, borderRadius: 10, padding: 10, marginTop: 8 },
  }));

  const refunded = Number(order.refunded_amount || 0);
  const hasRequest = order.request_type && order.request_status;
  if (!order.can_cancel && !order.can_return && !hasRequest && !refunded) return null;

  async function send() {
    setSending(true);
    try {
      const text = [t(`returns.reasons.${reason}`), details.trim()].filter(Boolean).join(" — ");
      onChange(await requestOrderHelp(order.id, type, text));
      setType(null);
      Alert.alert(t("returns.sent"));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSending(false);
    }
  }

  const statusColor = { pending: c.warning, approved: c.success, rejected: c.danger }[order.request_status] || c.text;

  return (
    <Card>
      <Text style={s.h2}>{t("returns.needHelp")}</Text>

      {hasRequest ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: statusColor, fontWeight: "700" }}>{t(`returns.status.${order.request_type}.${order.request_status}`)}</Text>
          {order.request_reason ? <Text style={{ color: c.muted, marginTop: 4 }}>{t("returns.reason")} : {order.request_reason}</Text> : null}
          {order.request_message ? (
            <View style={s.box}>
              <Text style={{ color: c.text, fontWeight: "700" }}>{t("returns.teamMessage")}</Text>
              <Text style={{ color: c.muted, marginTop: 4 }}>{order.request_message}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {refunded > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Ionicons name="cash-outline" size={18} color={c.success} />
          <Text style={{ color: c.success, fontWeight: "700" }}>{t("returns.refunded", { amount: formatUSD(refunded, i18n.language) })}</Text>
        </View>
      ) : null}

      {!type && (order.can_cancel || order.can_return) ? (
        <View style={{ gap: 10 }}>
          {order.can_cancel ? <Button title={t("returns.cancel")} variant="outline" icon="close-circle-outline" onPress={() => { setType("cancel"); setReason(""); setDetails(""); }} /> : null}
          {order.can_return ? (
            <>
              <Button title={t("returns.return")} variant="outline" icon="return-down-back-outline" onPress={() => { setType("return"); setReason(""); setDetails(""); }} />
              <Text style={{ color: c.muted, fontSize: 13 }}>{t("returns.returnUntil", { date: new Date(order.return_deadline).toLocaleDateString(i18n.language) })}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {type ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: c.text, fontWeight: "700" }}>{t(`returns.${type}`)}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {REASONS.map((r) => (
              <Pressable key={r} onPress={() => setReason(r)} style={[s.chip, reason === r && s.chipOn]}>
                <Text style={{ color: reason === r ? c.onPrimary : c.text }}>{t(`returns.reasons.${r}`)}</Text>
              </Pressable>
            ))}
          </View>
          <Input value={details} onChangeText={setDetails} placeholder={t("returns.details")} multiline maxLength={800} style={{ minHeight: 80, textAlignVertical: "top" }} />
          {type === "return" ? <Text style={{ color: c.muted, fontSize: 13 }}>{t("returns.policy", { days: order.return_days || 14 })}</Text> : null}
          <Button title={t("returns.send")} onPress={send} loading={sending} disabled={!reason} />
          <Button title={t("common.cancel")} variant="outline" onPress={() => setType(null)} />
        </View>
      ) : null}
    </Card>
  );
}
