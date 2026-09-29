import { useEffect, useState } from "react";
import { View, Text, Image, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/admin";
import { errorMessage } from "../lib/api";
import { Button, Input, Card, Choice, Group, useStyles } from "./ui";
import { STAFF_ROLES } from "../../../shared/settings";

export default function AdminTeam() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [busy, setBusy] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 18, fontWeight: "800" },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.border, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  }));

  const load = () => adminApi.team().then(setMembers).catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function apply(targetEmail, newRole) {
    setBusy(true);
    try {
      await adminApi.setRole(targetEmail, newRole);
      setEmail("");
      await load();
      Alert.alert(t("team.updated"));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  function changeRole(m) {
    Alert.alert(m.full_name || m.email, t("team.role"), [
      ...STAFF_ROLES.map((r) => ({ text: t(`team.roles.${r}`), onPress: () => apply(m.email, r) })),
      { text: t("team.remove"), style: "destructive", onPress: () => apply(m.email, "customer") },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 12 }}>
        <Text style={s.h2}>{t("team.add")}</Text>
        <Text style={{ color: c.muted }}>{t("team.subtitle")}</Text>
        <Input placeholder={t("team.email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Group>
          {STAFF_ROLES.map((r, i) => (
            <Choice key={r} label={`${t(`team.roles.${r}`)}\n${t(`team.desc.${r}`)}`} selected={role === r} onPress={() => setRole(r)} last={i === STAFF_ROLES.length - 1} />
          ))}
        </Group>
        <Button title={t("team.add")} onPress={() => email && apply(email.trim(), role)} loading={busy} disabled={!email} />
      </Card>

      <Card>
        <Text style={s.h2}>{t("team.title")}</Text>
        {members.length === 0 && <Text style={{ color: c.muted, marginTop: 8 }}>{t("team.empty")}</Text>}
        {members.map((m) => (
          <Pressable key={m.id} style={s.row} onPress={() => !m.owner && changeRole(m)} disabled={m.owner}>
            <View style={s.avatar}>
              {m.avatar_url ? <Image source={{ uri: m.avatar_url }} style={{ width: 40, height: 40 }} /> : <Ionicons name="person" size={20} color={c.muted} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: "700" }} numberOfLines={1}>{m.full_name || m.email}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>{m.email}</Text>
            </View>
            {m.owner ? (
              <Text style={{ color: c.warning, fontWeight: "700" }}>👑 {t("team.owner")}</Text>
            ) : (
              <>
                <Text style={{ color: c.primary, fontWeight: "600" }}>{t(`team.roles.${m.role}`)}</Text>
                <Ionicons name="chevron-forward" size={16} color={c.muted} />
              </>
            )}
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
