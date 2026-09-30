import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/admin";
import { errorMessage } from "../lib/api";
import { Card, Button, Loading, useStyles } from "./ui";
import { formatLocal, formatUSD, flag, countryName } from "../../../shared/settings";

export default function AdminFinances() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const L = i18n.language;
  const money = (a, c) => formatLocal(a, c, L);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 17, fontWeight: "800", marginBottom: 6 },
    big: { color: c.text, fontSize: 22, fontWeight: "800", marginTop: 4 },
    muted: { color: c.muted, fontSize: 13 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border, gap: 10 },
  }));

  const load = useCallback(() => adminApi.finances().then(setData).catch((e) => Alert.alert(t("common.error"), errorMessage(e, t))), [t]);
  useEffect(() => { load(); }, [load]);

  function remit(d) {
    Alert.alert(t("finances.remit"), t("finances.remitConfirm", { name: d.name || d.phone || "", amount: money(d.amount, d.currency) }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("finances.remit"),
        onPress: async () => {
          setBusy(true);
          try {
            await adminApi.remitCash(d.driver_id, d.currency);
            await load();
          } catch (e) {
            Alert.alert(t("common.error"), errorMessage(e, t));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (!data) return <Loading />;
  const st = data.stripe || {};
  const sales = data.sales || {};

  return (
    <View style={{ gap: 14 }}>
      <Text style={s.muted}>🔒 {t("finances.safe")}</Text>

      <Card>
        <Text style={s.muted}>{t("finances.available")}</Text>
        <Text style={s.big}>{(st.available || []).map((b) => money(b.amount, b.currency)).join(" · ") || "—"}</Text>
        <Text style={[s.muted, { marginTop: 10 }]}>{t("finances.pending")}</Text>
        <Text style={[s.big, { fontSize: 18 }]}>{(st.pending || []).map((b) => money(b.amount, b.currency)).join(" · ") || "—"}</Text>
        <Text style={[s.muted, { marginTop: 10 }]}>{t("finances.sales30", { days: sales.days || 30 })}</Text>
        <Text style={[s.big, { fontSize: 18 }]}>{formatUSD(sales.total_usd || 0, L)} · {t("finances.ordersCount", { count: sales.count || 0 })}</Text>
        {st.mode === "test" ? <Text style={{ color: c.warning, marginTop: 8, fontSize: 13 }}>🧪 {t("finances.testMode")}</Text> : null}
        {st.error ? <Text style={{ color: c.danger, marginTop: 8, fontSize: 13 }}>Stripe : {st.error}</Text> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={s.h2}>🏦 {t("finances.bankTitle")}</Text>
        <Text style={s.muted}>{st.payouts_enabled === false ? `⚠️ ${t("finances.noBank")}` : t("finances.bankHint")}</Text>
        {(st.payouts || []).length === 0 ? <Text style={s.muted}>{t("finances.noPayouts")}</Text> : null}
        {(st.payouts || []).map((p) => (
          <View key={p.id} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "700" }}>{money(p.amount, p.currency)}</Text>
              <Text style={s.muted}>{new Date(p.arrival_date).toLocaleDateString(L)}{p.bank ? ` · •••• ${p.bank.last4 || ""}` : ""}</Text>
            </View>
            <Text style={{ color: p.status === "paid" ? c.success : p.status === "failed" ? c.danger : c.primary, fontWeight: "700" }}>{t(`finances.payoutStatus.${p.status}`, p.status)}</Text>
          </View>
        ))}
        {st.links?.payouts ? <Button title={t("finances.manageBank")} icon="open-outline" onPress={() => Linking.openURL(st.links.payouts)} /> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={s.h2}>💵 {t("finances.cashTitle")}</Text>
        <Text style={s.muted}>{t("finances.cashHint")}</Text>
        {!data.remit_enabled ? <Text style={{ color: c.warning, fontSize: 12 }}>{t("finances.needSql")}</Text> : null}
        {data.drivers.length === 0 ? <Text style={s.muted}>{t("finances.noCash")}</Text> : null}
        {data.drivers.map((d) => (
          <View key={`${d.driver_id}-${d.currency}`} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "700" }}>🛵 {d.name || t("delivery.driver")}</Text>
              <Text style={s.muted}>{t("finances.ordersCount", { count: d.count })}</Text>
              {d.phone ? <Pressable onPress={() => Linking.openURL(`tel:${d.phone}`)}><Text style={{ color: c.primary, fontSize: 13 }}>📞 {d.phone}</Text></Pressable> : null}
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={{ color: c.warning, fontWeight: "800" }}>{money(d.amount, d.currency)}</Text>
              {data.remit_enabled ? (
                <Pressable disabled={busy} onPress={() => remit(d)}><Text style={{ color: c.primary, fontWeight: "700" }}>{t("finances.remit")}</Text></Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </Card>

      {Object.keys(sales.byCountry || {}).length ? (
        <Card>
          <Text style={s.h2}>{t("finances.byCountry")}</Text>
          {Object.entries(sales.byCountry).map(([code, v]) => (
            <View key={code} style={s.row}>
              <Text style={{ color: c.text, flex: 1 }}>{flag(code)} {countryName(code, L)} · {v.count}</Text>
              <Text style={{ color: c.text, fontWeight: "700" }}>{formatUSD(v.total_usd, L)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
