import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import useAuth from "../../src/lib/useAuth";
import { useWishlist } from "../../src/store/wishlist";
import { Button, Loading } from "../../src/components/ui";
import { colors } from "../../src/theme";

function AuthForm() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setBusy(false);
    if (error) return Alert.alert("Error", error.message);
    if (mode === "register") Alert.alert("Account created", "Check your email to confirm your account if required.");
  }

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{mode === "login" ? "Welcome back" : "Create account"}</Text>
      {mode === "register" && (
        <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={fullName} onChangeText={setFullName} />
      )}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />
      <Button title={mode === "login" ? "Log in" : "Sign up"} onPress={submit} loading={busy} />
      <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.primary, textAlign: "center" }}>
          {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, badge }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Account() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const wishlistCount = useWishlist((s) => s.items.length);

  useEffect(() => {
    if (!user) return setProfile(null);
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  if (loading) return <Loading />;
  if (!user) return <AuthForm />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <View style={styles.avatar}><Ionicons name="person" size={36} color="#000" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name || "My account"}</Text>
          <Text style={{ color: colors.muted }}>{user.email}</Text>
        </View>
      </View>

      <MenuItem icon="receipt-outline" label="My orders" onPress={() => router.push("/orders")} />
      <MenuItem icon="heart-outline" label="Wishlist" badge={wishlistCount || null} onPress={() => router.push("/wishlist")} />
      <MenuItem icon="cart-outline" label="Cart" onPress={() => router.push("/cart")} />

      <Button title="Log out" variant="danger" onPress={() => supabase.auth.signOut()} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14, backgroundColor: colors.bg },
  title: { color: colors.primary, fontSize: 30, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  input: { backgroundColor: colors.card, color: colors.text, borderRadius: 12, padding: 16, fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  name: { color: colors.text, fontSize: 20, fontWeight: "800" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  menuLabel: { color: colors.text, fontSize: 16, flex: 1 },
  badge: { color: "#fff", backgroundColor: colors.pink, borderRadius: 10, paddingHorizontal: 8, overflow: "hidden", fontWeight: "700" },
});
