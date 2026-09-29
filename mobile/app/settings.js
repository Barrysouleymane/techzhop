import { useEffect, useState } from "react";
import { ScrollView, Text, Linking } from "react-native";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import useAuth from "../src/lib/useAuth";
import { useSettings } from "../src/store/settings";
import { deviceCurrency } from "../src/lib/money";
import { deviceLanguage } from "../src/i18n";
import { getProfile, updateProfile } from "../src/lib/api";
import { registerForPush } from "../src/lib/push";
import { Group, Row, Choice, SectionTitle, Toggle, useStyles } from "../src/components/ui";
import { LANGUAGES, CURRENCIES } from "../../shared/settings";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { language, currency, theme, setLanguage, setCurrency, setTheme } = useSettings();
  const [prefs, setPrefs] = useState(null);
  const [pushDenied, setPushDenied] = useState(false);
  const [, c] = useStyles(() => ({}));

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => setPrefs({ notify_orders: p?.notify_orders ?? true, notify_promos: p?.notify_promos ?? false }));
    Notifications.getPermissionsAsync().then(({ status }) => setPushDenied(status === "denied")).catch(() => {});
  }, [user]);

  async function savePref(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
    await updateProfile(user.id, { [key]: value }).catch(() => {});
    if (value) {
      const r = await registerForPush(user.id, i18n.language);
      setPushDenied(r === "denied");
    }
  }

  const deviceLangName = LANGUAGES.find((l) => l.code === deviceLanguage())?.name;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <SectionTitle>{t("settings.language")}</SectionTitle>
      <Group>
        <Choice label={`${t("settings.languageAuto")} · ${deviceLangName}`} selected={!language} onPress={() => setLanguage(null)} />
        {LANGUAGES.map((l, i) => (
          <Choice key={l.code} label={l.name} selected={language === l.code} onPress={() => setLanguage(l.code)} last={i === LANGUAGES.length - 1} />
        ))}
      </Group>

      <SectionTitle>{t("settings.currency")}</SectionTitle>
      <Group>
        <Choice label={`${t("settings.currencyAuto")} · ${deviceCurrency()}`} selected={!currency} onPress={() => setCurrency(null)} />
        {CURRENCIES.map((cur, i) => (
          <Choice key={cur.code} label={`${cur.code} — ${cur.name}`} selected={currency === cur.code} onPress={() => setCurrency(cur.code)} last={i === CURRENCIES.length - 1} />
        ))}
      </Group>
      <Text style={{ color: c.muted, fontSize: 12, marginTop: 8, marginHorizontal: 4 }}>{t("settings.currencyNote")}</Text>

      <SectionTitle>{t("settings.theme")}</SectionTitle>
      <Group>
        <Choice label={t("settings.themeSystem")} selected={theme === "system"} onPress={() => setTheme("system")} />
        <Choice label={t("settings.themeLight")} selected={theme === "light"} onPress={() => setTheme("light")} />
        <Choice label={t("settings.themeDark")} selected={theme === "dark"} onPress={() => setTheme("dark")} last />
      </Group>

      {user && prefs && (
        <>
          <SectionTitle>{t("settings.notifications")}</SectionTitle>
          <Group>
            <Row icon="receipt-outline" label={t("settings.notifyOrders")} subtitle={t("settings.notifyOrdersText")} right={<Toggle value={prefs.notify_orders} onValueChange={(v) => savePref("notify_orders", v)} />} />
            <Row icon="pricetag-outline" label={t("settings.notifyPromos")} subtitle={t("settings.notifyPromosText")} right={<Toggle value={prefs.notify_promos} onValueChange={(v) => savePref("notify_promos", v)} />} last />
          </Group>
          {pushDenied && (
            <Text onPress={() => Linking.openSettings()} style={{ color: c.warning, fontSize: 13, marginTop: 8, marginHorizontal: 4 }}>
              {t("settings.pushDenied")}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}
