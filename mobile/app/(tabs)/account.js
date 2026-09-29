import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import useAuth from "../../src/lib/useAuth";
import { useWishlist } from "../../src/store/wishlist";
import { getProfile, getOrders, getAddresses } from "../../src/lib/api";
import { Button, Loading, Input, Group, Row, SectionTitle, Badge, useStyles } from "../../src/components/ui";

function AuthForm() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [, c] = useStyles(() => ({}));

  async function submit() {
    if (mode === "register" && password.length < 6) return Alert.alert(t("auth.passwordTooShort"));
    setBusy(true);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName } } });
    setBusy(false);
    if (error) return Alert.alert(t("common.error"), error.message);
    if (mode === "register") Alert.alert(t("auth.accountCreated"));
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.primary, fontSize: 30, fontWeight: "800", textAlign: "center", marginBottom: 12 }}>
          {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
        </Text>
        {mode === "register" && <Input placeholder={t("auth.fullName")} value={fullName} onChangeText={setFullName} autoComplete="name" />}
        <Input placeholder={t("auth.email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
        <Input placeholder={t("auth.password")} secureTextEntry value={password} onChangeText={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        {mode === "login" && (
          <Pressable onPress={() => router.push("/forgot-password")} style={{ alignSelf: "flex-end" }}>
            <Text style={{ color: c.primary }}>{t("auth.forgot")}</Text>
          </Pressable>
        )}
        <Button title={mode === "login" ? t("auth.login") : t("auth.register")} onPress={submit} loading={busy} />
        <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ marginTop: 8 }}>
          <Text style={{ color: c.primary, textAlign: "center" }}>
            {mode === "login" ? `${t("auth.noAccount")} ${t("auth.register")}` : `${t("auth.haveAccount")} ${t("auth.login")}`}
          </Text>
        </Pressable>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 24 }}>
          <Pressable onPress={() => router.push("/settings")}><Text style={{ color: c.muted }}>{t("settings.title")}</Text></Pressable>
          <Pressable onPress={() => router.push("/help")}><Text style={{ color: c.muted }}>{t("nav.help")}</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function Account() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const wishlistCount = useWishlist((s) => s.items.length);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ orders: 0, addresses: 0 });
  const [s, c] = useStyles((c) => ({
    header: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: c.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: c.border },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    name: { color: c.text, fontSize: 20, fontWeight: "800" },
  }));

  useFocusEffect(
    useCallback(() => {
      if (!user) return setProfile(null);
      getProfile(user.id).then(setProfile).catch(() => {});
      getOrders().then((o) => setCounts((x) => ({ ...x, orders: o.length }))).catch(() => {});
      getAddresses(user.id).then((a) => setCounts((x) => ({ ...x, addresses: a.length }))).catch(() => {});
    }, [user])
  );

  if (loading) return <Loading />;
  if (!user) return <AuthForm />;

  const count = (n) => (n > 0 ? <Badge color={c.border}><Text style={{ color: c.text }}>{n}</Text></Badge> : null);
  const go = (path) => () => router.push(path);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} style={{ backgroundColor: c.bg }}>
      <Pressable style={s.header} onPress={go("/profile")}>
        <View style={s.avatar}>
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} /> : <Ionicons name="person" size={36} color={c.onPrimary} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{profile?.full_name || user.user_metadata?.full_name || t("account.title")}</Text>
          <Text style={{ color: c.muted }} numberOfLines={1}>{user.email}</Text>
          <Text style={{ color: c.muted, fontSize: 13 }}>{profile?.phone || t("account.noPhone")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.muted} />
      </Pressable>

      <SectionTitle>{t("account.myAccount")}</SectionTitle>
      <Group>
        <Row icon="person-outline" label={t("account.profile")} onPress={go("/profile")} />
        <Row icon="location-outline" label={t("account.addresses")} onPress={go("/addresses")} right={count(counts.addresses)} />
        <Row icon="receipt-outline" label={t("account.orders")} onPress={go("/orders")} right={count(counts.orders)} />
        <Row icon="heart-outline" label={t("account.wishlist")} onPress={go("/wishlist")} right={wishlistCount > 0 ? <Badge>{wishlistCount}</Badge> : null} last />
      </Group>

      <SectionTitle>{t("account.preferences")}</SectionTitle>
      <Group>
        <Row icon="notifications-outline" label={t("account.notifications")} onPress={go("/settings")} />
        <Row icon="globe-outline" label={t("account.language")} onPress={go("/settings")} />
        <Row icon="cash-outline" label={t("account.currency")} onPress={go("/settings")} />
        <Row icon="contrast-outline" label={t("account.theme")} onPress={go("/settings")} last />
      </Group>

      <SectionTitle>{t("account.security")}</SectionTitle>
      <Group>
        <Row icon="key-outline" label={t("account.changePassword")} onPress={go("/security")} />
        <Row icon="trash-outline" label={t("account.deleteAccount")} onPress={go("/security")} danger last />
      </Group>

      <SectionTitle>{t("account.support")}</SectionTitle>
      <Group>
        <Row icon="help-buoy-outline" label={t("account.help")} onPress={go("/help")} />
        <Row icon="document-text-outline" label={t("account.terms")} onPress={go("/legal/terms")} />
        <Row icon="shield-checkmark-outline" label={t("account.privacy")} onPress={go("/legal/privacy")} last />
      </Group>

      <Button title={t("auth.logout")} variant="danger" icon="log-out-outline" onPress={() => supabase.auth.signOut()} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}
