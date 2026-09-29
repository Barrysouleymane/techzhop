import { useCallback, useState } from "react";
import { FlatList, View, Text, Pressable, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import useAuth from "../../src/lib/useAuth";
import { getAddresses, deleteAddress, saveAddress } from "../../src/lib/api";
import { Button, Empty, useStyles } from "../../src/components/ui";
import { formatAddress } from "../../../shared/settings";

export default function Addresses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [s, c] = useStyles((c) => ({
    card: { flexDirection: "row", gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: c.border },
    title: { color: c.text, fontWeight: "700" },
    badge: { color: c.onPrimary, backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 6, overflow: "hidden", fontSize: 12, fontWeight: "700" },
  }));

  const load = useCallback(() => {
    if (user) getAddresses(user.id).then(setList).catch(() => {});
  }, [user]);
  useFocusEffect(load);

  function confirmDelete(id) {
    Alert.alert(t("addresses.deleteConfirm"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => { await deleteAddress(id); load(); } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={<Empty icon="location-outline">{t("addresses.empty")}</Empty>}
        renderItem={({ item: a }) => (
          <Pressable style={s.card} onPress={() => router.push({ pathname: "/addresses/edit", params: { id: a.id } })}>
            <Ionicons name="location-outline" size={22} color={c.primary} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Text style={s.title}>{a.label || a.full_name}</Text>
                {a.is_default && <Text style={s.badge}>{t("addresses.default")}</Text>}
              </View>
              <Text style={{ color: c.muted }}>{formatAddress(a)}</Text>
              {!a.is_default && (
                <Pressable onPress={async () => { await saveAddress(user.id, { ...a, is_default: true }); load(); }}>
                  <Text style={{ color: c.primary, marginTop: 4 }}>{t("addresses.setDefault")}</Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => confirmDelete(a.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={c.danger} />
            </Pressable>
          </Pressable>
        )}
      />
      <View style={{ padding: 16 }}>
        <Button title={t("addresses.add")} icon="add" onPress={() => router.push("/addresses/edit")} />
      </View>
    </View>
  );
}
