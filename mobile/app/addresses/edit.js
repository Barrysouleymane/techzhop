import { useEffect, useState } from "react";
import { ScrollView, Alert, View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import useAuth from "../../src/lib/useAuth";
import { getAddress, saveAddress, errorMessage } from "../../src/lib/api";
import { Button, Input, Card, Toggle, useStyles } from "../../src/components/ui";

const EMPTY = { label: "", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "", is_default: false };

export default function EditAddress() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [a, setA] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [, c] = useStyles(() => ({}));

  useEffect(() => {
    if (id) getAddress(id).then(setA).catch(() => {});
  }, [id]);

  const set = (k) => (v) => setA({ ...a, [k]: v });
  const opt = (label) => `${label} (${t("common.optional")})`;

  async function save() {
    if (!a.full_name || !a.line1 || !a.city || !a.country) {
      return Alert.alert(`${t("addresses.fullName")}, ${t("addresses.line1")}, ${t("addresses.city")}, ${t("addresses.country")}`);
    }
    setSaving(true);
    try {
      await saveAddress(user.id, a);
      router.back();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: id ? t("addresses.edit") : t("addresses.add") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <Input label={opt(t("addresses.label"))} placeholder={t("addresses.labelPlaceholder")} value={a.label || ""} onChangeText={set("label")} />
          <Input label={t("addresses.fullName")} value={a.full_name} onChangeText={set("full_name")} autoComplete="name" />
          <Input label={t("addresses.phone")} value={a.phone || ""} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Input label={t("addresses.line1")} value={a.line1} onChangeText={set("line1")} autoComplete="address-line1" />
          <Input label={opt(t("addresses.line2"))} value={a.line2 || ""} onChangeText={set("line2")} />
          <Input label={t("addresses.city")} value={a.city} onChangeText={set("city")} />
          <Input label={opt(t("addresses.state"))} value={a.state || ""} onChangeText={set("state")} />
          <Input label={opt(t("addresses.postalCode"))} value={a.postal_code || ""} onChangeText={set("postal_code")} autoComplete="postal-code" />
          <Input label={t("addresses.country")} value={a.country} onChangeText={set("country")} autoComplete="country" />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: c.text, fontSize: 16 }}>{t("addresses.setDefault")}</Text>
            <Toggle value={!!a.is_default} onValueChange={set("is_default")} />
          </View>
        </Card>
        <Button title={t("common.save")} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
