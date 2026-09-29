import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/admin";
import { errorMessage } from "../lib/api";
import { Card, Button, Input, Toggle, useStyles } from "./ui";
import { formatUSD } from "../../../shared/settings";

/** Admin side: customer's cancel/return request + refund */
export default function AdminOrderMoney({ order, fields, canRefund, onChange }) {
  const { t, i18n } = useTranslation();
  const usd = (n) => formatUSD(n, i18n.language);
  const refunded = Number(order.refunded_amount || 0);
  const refundable = Math.max(0, Math.round((Number(order.total) - refunded) * 100) / 100);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(String(refundable));
  const [restock, setRestock] = useState(!!order.request_type);
  const [cancel, setCancel] = useState(order.request_type === "cancel" || ["paid", "processing"].includes(order.status));
  const [busy, setBusy] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 4 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  }));

  if (!fields?.returns) {
    return <Card><Text style={{ color: c.warning, fontSize: 13 }}>{t("returns.needSql")}</Text></Card>;
  }

  async function run(fn) {
    setBusy(true);
    try {
      const o = await fn();
      onChange(o);
      return o;
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  function doRefund(value = amount) {
    const v = Number(String(value).replace(",", "."));
    if (!(v > 0)) return;
    Alert.alert(t("returns.refundTitle"), t("returns.refundConfirm", { amount: usd(v) }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("returns.refundBtn", { amount: usd(v) }),
        style: "destructive",
        onPress: () =>
          run(() => adminApi.refund(order.id, { amount: v, restock, cancel })).then((o) => {
            if (!o) return;
            setAmount(String(Math.max(0, Math.round((Number(o.total) - Number(o.refunded_amount || 0)) * 100) / 100)));
            Alert.alert(t("returns.refundDone"));
          }),
      },
    ]);
  }

  const pending = order.request_status === "pending";

  return (
    <>
      {order.request_type ? (
        <Card style={[{ gap: 8 }, pending && { borderColor: c.warning }]}>
          <Text style={s.h2}>↩️ {t("returns.requestTitle")}</Text>
          <Text style={{ color: c.text, fontWeight: "700" }}>{t(`returns.status.${order.request_type}.${order.request_status}`)}</Text>
          {order.request_reason ? <Text style={{ color: c.muted }}>{t("returns.reason")} : {order.request_reason}</Text> : null}
          {order.request_message ? <Text style={{ color: c.muted }}>{t("returns.teamMessage")} : {order.request_message}</Text> : null}
          {pending ? (
            <>
              <Input value={message} onChangeText={setMessage} placeholder={t("returns.messagePlaceholder")} multiline style={{ minHeight: 70, textAlignVertical: "top" }} />
              {canRefund && order.request_type === "cancel" && refundable > 0 ? (
                <Button title={t("returns.approveRefund")} loading={busy} onPress={() => doRefund(refundable)} />
              ) : null}
              <Button title={t("returns.approve")} variant={canRefund && order.request_type === "cancel" ? "outline" : "primary"} loading={busy}
                onPress={() => run(() => adminApi.decide(order.id, "approved", message))} />
              <Button title={t("returns.reject")} variant="danger" loading={busy}
                onPress={() => run(() => adminApi.decide(order.id, "rejected", message))} />
            </>
          ) : null}
        </Card>
      ) : null}

      {canRefund && order.stripe_session_id ? (
        <Card style={{ gap: 10 }}>
          <Text style={s.h2}>{t("returns.refundTitle")}</Text>
          {refunded > 0 ? (
            <Text style={{ color: c.success }}>{refundable > 0 ? t("returns.alreadyRefunded", { amount: usd(refunded) }) : t("returns.fullyRefunded")}</Text>
          ) : null}
          {refundable > 0 ? (
            <>
              <Input label={t("returns.refundAmount")} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
              <View style={s.row}><Text style={{ color: c.text, flex: 1 }}>{t("returns.restock")}</Text><Toggle value={restock} onValueChange={setRestock} /></View>
              {order.status !== "delivered" && order.status !== "cancelled" ? (
                <View style={s.row}><Text style={{ color: c.text, flex: 1 }}>{t("returns.cancelOrder")}</Text><Toggle value={cancel} onValueChange={setCancel} /></View>
              ) : null}
              <Button title={t("returns.refundBtn", { amount: usd(Number(String(amount).replace(",", ".")) || 0) })} variant="danger" loading={busy} onPress={() => doRefund()} />
            </>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
