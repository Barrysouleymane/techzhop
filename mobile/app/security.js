import { useState } from "react";
import { ScrollView, Text, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import useAuth from "../src/lib/useAuth";
import { changePassword, deleteMyAccount, errorMessage } from "../src/lib/api";
import { Button, Input, Card, useStyles } from "../src/components/ui";

export default function Security() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 18, fontWeight: "800" },
    danger: { borderColor: c.danger, gap: 12 },
  }));

  async function updatePassword() {
    if (pw.next.length < 6) return Alert.alert(t("auth.passwordTooShort"));
    if (pw.next !== pw.confirm) return Alert.alert(t("auth.passwordsNoMatch"));
    setBusy(true);
    try {
      await changePassword(user.email, pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      Alert.alert(t("security.updated"));
    } catch (e) {
      Alert.alert(e.code === "WRONG_PASSWORD" ? t("security.wrongPassword") : errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  function askDelete() {
    Alert.alert(t("security.deleteTitle"), t("security.deleteText"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteMyAccount();
            Alert.alert(t("security.deleted"));
            router.replace("/");
          } catch (e) {
            Alert.alert(t("common.error"), errorMessage(e, t));
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <Text style={s.h2}>{t("security.changePassword")}</Text>
          <Input label={t("security.currentPassword")} secureTextEntry value={pw.current} onChangeText={(v) => setPw({ ...pw, current: v })} autoComplete="current-password" />
          <Input label={t("security.newPassword")} secureTextEntry value={pw.next} onChangeText={(v) => setPw({ ...pw, next: v })} autoComplete="new-password" />
          <Input label={t("security.confirmPassword")} secureTextEntry value={pw.confirm} onChangeText={(v) => setPw({ ...pw, confirm: v })} autoComplete="new-password" />
          <Button title={t("security.update")} onPress={updatePassword} loading={busy} />
        </Card>

        <Card style={s.danger}>
          <Text style={[s.h2, { color: c.danger }]}>{t("security.deleteTitle")}</Text>
          <Text style={{ color: c.muted, lineHeight: 20 }}>{t("security.deleteText")}</Text>
          <Input label={t("security.deleteConfirmLabel")} value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} />
          <Button title={t("security.deleteButton")} variant="danger" onPress={askDelete} disabled={confirmText !== "DELETE"} loading={deleting} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
