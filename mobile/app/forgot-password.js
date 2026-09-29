import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { sendPasswordReset } from "../src/lib/api";
import { Button, Input, useStyles } from "../src/components/ui";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, c] = useStyles(() => ({}));

  async function submit() {
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: c.bg }}>
      {sent ? (
        <Text style={{ color: c.success, fontSize: 16 }}>{t("auth.linkSent")}</Text>
      ) : (
        <>
          <Text style={{ color: c.muted, fontSize: 15 }}>{t("auth.forgotText")}</Text>
          <Input placeholder={t("auth.email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Button title={t("auth.sendLink")} onPress={submit} loading={busy} disabled={!email} />
        </>
      )}
    </View>
  );
}
