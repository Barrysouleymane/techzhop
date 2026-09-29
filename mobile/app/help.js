import { useState } from "react";
import { ScrollView, Text, Pressable, View, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "../src/lib/api";
import { Group, Row, SectionTitle, useStyles } from "../src/components/ui";

export default function Help() {
  const { t } = useTranslation();
  const faq = t("help.faq", { returnObjects: true });
  const [open, setOpen] = useState(null);
  const [, c] = useStyles(() => ({}));

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ color: c.muted, fontSize: 15, lineHeight: 21 }}>{t("help.subtitle")}</Text>

      <SectionTitle>{t("help.contact")}</SectionTitle>
      <Group>
        <Row icon="mail-outline" label={t("help.emailUs")} subtitle={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} last={!SUPPORT_WHATSAPP} />
        {SUPPORT_WHATSAPP ? (
          <Row icon="logo-whatsapp" label={t("help.whatsapp")} subtitle={`+${SUPPORT_WHATSAPP}`} onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)} last />
        ) : null}
      </Group>
      <Text style={{ color: c.muted, fontSize: 12, marginTop: 8, marginHorizontal: 4 }}>{t("help.responseTime")}</Text>

      <SectionTitle>{t("help.faqTitle")}</SectionTitle>
      <Group>
        {Array.isArray(faq) &&
          faq.map((item, i) => (
            <Pressable key={item.q} onPress={() => setOpen(open === i ? null : i)} style={{ padding: 16, borderBottomWidth: i === faq.length - 1 ? 0 : 0.5, borderBottomColor: c.border }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text style={{ color: c.text, fontWeight: "600", flex: 1, fontSize: 15 }}>{item.q}</Text>
                <Ionicons name={open === i ? "remove" : "add"} size={20} color={c.primary} />
              </View>
              {open === i && <Text style={{ color: c.muted, marginTop: 8, lineHeight: 20 }}>{item.a}</Text>}
            </Pressable>
          ))}
      </Group>
    </ScrollView>
  );
}
