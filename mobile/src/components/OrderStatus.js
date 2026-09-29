import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColors } from "../theme";
import { ORDER_STEPS } from "../../../shared/settings";

export function statusColor(status, c) {
  return (
    { pending: c.warning, paid: c.success, processing: "#3b82f6", shipped: "#6366f1", delivered: c.success, cancelled: c.danger, failed: c.danger }[status] || c.muted
  );
}

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <Text style={{ color: statusColor(status, c), fontWeight: "700" }}>
      {t(`orders.status.${status}`, { defaultValue: status })}
    </Text>
  );
}

export function StatusTimeline({ status }) {
  const { t } = useTranslation();
  const c = useColors();
  if (status === "cancelled" || status === "failed") return <StatusBadge status={status} />;
  const current = ORDER_STEPS.indexOf(status);

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {ORDER_STEPS.map((step, i) => {
        const done = current >= i;
        return (
          <View key={step} style={{ flex: 1, alignItems: "center" }}>
            {i > 0 && (
              <View style={{ position: "absolute", top: 15, right: "50%", width: "100%", height: 3, backgroundColor: done ? c.primary : c.border }} />
            )}
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: done ? c.primary : c.border }}>
              {done ? <Ionicons name="checkmark" size={18} color={c.onPrimary} /> : <Text style={{ color: c.muted, fontWeight: "700" }}>{i + 1}</Text>}
            </View>
            <Text style={{ color: done ? c.text : c.muted, fontSize: 12, marginTop: 6, textAlign: "center" }}>
              {t(`orders.status.${step}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
