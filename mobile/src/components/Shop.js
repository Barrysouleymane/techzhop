import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColors } from "../theme";
import { useMoney } from "../lib/money";
import { isOnSale, effectivePrice, discountPercent, timeLeft, promoBarVisible } from "../../../shared/settings";
import { router } from "expo-router";
import { useShop } from "../store/shop";

export function Stars({ value = 0, count, size = 14, onChange }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const icon = <Ionicons name={value >= i - 0.25 ? "star" : "star-outline"} size={size} color={value >= i - 0.25 ? "#facc15" : c.muted} />;
          return onChange ? (
            <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} style={{ padding: 2 }}>{icon}</Pressable>
          ) : (
            <View key={i}>{icon}</View>
          );
        })}
      </View>
      {count != null && <Text style={{ color: c.muted, fontSize: size - 2 }}>({count})</Text>}
    </View>
  );
}

export function PriceTag({ product, size = 16 }) {
  const { t } = useTranslation();
  const c = useColors();
  const money = useMoney();
  const sale = isOnSale(product);
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
      <Text style={{ color: c.primary, fontWeight: "800", fontSize: size }}>{money(effectivePrice(product))}</Text>
      {sale && (
        <>
          <Text style={{ color: c.muted, textDecorationLine: "line-through", fontSize: size * 0.7 }}>{money(product.price)}</Text>
          <Text style={{ color: "#fff", backgroundColor: "#dc2626", fontSize: 11, fontWeight: "800", paddingHorizontal: 5, borderRadius: 4, overflow: "hidden" }}>
            {t("product.off", { percent: discountPercent(product) })}
          </Text>
        </>
      )}
    </View>
  );
}

export function Countdown({ until, compact, color = "#f87171" }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(() => timeLeft(until));
  useEffect(() => {
    const id = setInterval(() => setLeft(timeLeft(until)), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (!left) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Ionicons name="time-outline" size={compact ? 12 : 16} color={color} />
      <Text style={{ color, fontWeight: "700", fontSize: compact ? 11 : 14, fontVariant: ["tabular-nums"] }}>
        {compact ? "" : `${t("product.endsIn")} `}
        {t("product.countdown", { d: left.days, h: pad(left.hours), m: pad(left.minutes), s: pad(left.seconds) })}
      </Text>
    </View>
  );
}

/** Site-wide announcement bar (Admin → Store) */
export function PromoBar() {
  const settings = useShop((s) => s.settings);
  if (!promoBarVisible(settings)) return null;
  const b = settings.promo_bar;
  return (
    <Pressable
      onPress={() => b.link?.startsWith("/") && router.push(b.link)}
      style={{ backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, alignItems: "center", gap: 4 }}
    >
      <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>{b.text}</Text>
      {b.ends_at ? <Countdown until={b.ends_at} compact color="#fff" /> : null}
    </Pressable>
  );
}
