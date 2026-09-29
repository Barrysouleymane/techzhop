import { ScrollView, Text } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/theme";
import { LEGAL_LAST_UPDATED } from "../../../shared/settings";

export default function Legal() {
  const { t, i18n } = useTranslation();
  const { type } = useLocalSearchParams();
  const c = useColors();
  const kind = type === "privacy" ? "privacy" : "terms";
  const sections = t(`legal.${kind}`, { returnObjects: true });
  const date = new Date(LEGAL_LAST_UPDATED).toLocaleDateString(i18n.language, { dateStyle: "long" });

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: t(kind === "terms" ? "legal.termsTitle" : "legal.privacyTitle") }} />
      <Text style={{ color: c.muted, marginBottom: 16 }}>{t("legal.lastUpdated", { date })}</Text>
      {Array.isArray(sections) &&
        sections.map((s) => (
          <Text key={s.h} style={{ marginBottom: 18 }}>
            <Text style={{ color: c.text, fontWeight: "800", fontSize: 17 }}>{s.h}{"\n"}</Text>
            <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>{s.p}</Text>
          </Text>
        ))}
    </ScrollView>
  );
}
