import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import useAuth from "../lib/useAuth";
import { useLocation, useDeliveryLocation } from "../store/location";
import { Button, Input, useStyles } from "./ui";
import { countryOptions, countryName, locationPlace, firstName, formatAddress } from "../../../shared/settings";

/** "Deliver to Souleymane — Brooklyn 11225" bar */
export function DeliverToBar({ style }) {
  const { t, i18n } = useTranslation();
  const loc = useDeliveryLocation();
  const setOpen = useLocation((s) => s.setOpen);
  const name = firstName(loc.name);
  const [s, c] = useStyles((c) => ({
    bar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, marginBottom: 12 },
  }));
  return (
    <Pressable style={[s.bar, style]} onPress={() => setOpen(true)}>
      <Ionicons name="location-outline" size={20} color={c.primary} />
      <Text style={{ color: c.text, flex: 1 }} numberOfLines={1}>
        {name ? t("location.deliverToName", { name }) : t("location.deliverTo")}{" — "}
        <Text style={{ fontWeight: "800" }}>{locationPlace(loc, i18n.language)}</Text>
      </Text>
      <Ionicons name="chevron-down" size={18} color={c.muted} />
    </Pressable>
  );
}

/** The chooser, mounted once in the root layout */
export function LocationModal() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const open = useLocation((st) => st.open);
  const setOpen = useLocation((st) => st.setOpen);
  const addresses = useLocation((st) => st.addresses);
  const setChoice = useLocation((st) => st.setChoice);
  const loadAddresses = useLocation((st) => st.loadAddresses);
  const loc = useDeliveryLocation();
  const [country, setCountry] = useState(loc.country);
  const [zip, setZip] = useState("");
  const [dirty, setDirty] = useState(false);
  const [picking, setPicking] = useState(false);
  const [s, c] = useStyles((c) => ({
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    title: { color: c.text, fontSize: 18, fontWeight: "800" },
    card: { borderWidth: 2, borderColor: c.border, backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    or: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
    line: { flex: 1, height: 1, backgroundColor: c.border },
    select: { flexDirection: "row", alignItems: "center", backgroundColor: c.input, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 13 },
    option: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: "row", justifyContent: "space-between" },
  }));

  // Keep the saved addresses fresh
  useEffect(() => {
    loadAddresses(user?.id);
  }, [user?.id, loadAddresses]);

  useEffect(() => {
    if (!open) return;
    loadAddresses(user?.id);
    setCountry(loc.country);
    setZip(loc.address ? "" : loc.zip);
    setDirty(false);
    setPicking(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setOpen(false);
  const pick = (a) => {
    setChoice({ type: "address", id: a.id });
    close();
  };
  const apply = () => {
    setChoice({ type: "zip", country, zip: zip.trim().toUpperCase() });
    close();
  };
  const go = (path) => {
    close();
    setTimeout(() => router.push(path), 250);
  };

  const selectedId = loc.address?.id;

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={s.head}>
          <Text style={s.title}>{t("location.title")}</Text>
          <Pressable onPress={close} hitSlop={12}><Ionicons name="close" size={26} color={c.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: c.muted, marginBottom: 16 }}>{t("location.intro")}</Text>

          {user ? (
            <>
              {addresses.map((a) => (
                <Pressable key={a.id} onPress={() => pick(a)} style={[s.card, a.id === selectedId && { borderColor: c.primary }]}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Text style={{ color: c.text, flex: 1 }}>
                      <Text style={{ fontWeight: "800" }}>{a.full_name} </Text>
                      {formatAddress({ ...a, full_name: "", phone: "" })}
                    </Text>
                    {a.id === selectedId && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
                  </View>
                  {a.is_default && <Text style={{ color: c.muted, fontWeight: "700", marginTop: 6 }}>{t("location.default")}</Text>}
                </Pressable>
              ))}
              <Pressable onPress={() => go(addresses.length ? "/addresses" : "/addresses/edit")} hitSlop={8}>
                <Text style={{ color: c.primary, fontWeight: "600" }}>{addresses.length ? t("location.manage") : t("location.addAddress")}</Text>
              </Pressable>
            </>
          ) : (
            <Button title={t("location.signIn")} onPress={() => go("/account")} />
          )}

          <View style={s.or}>
            <View style={s.line} />
            <Text style={{ color: c.muted, fontSize: 13 }}>{t("location.orZip")}</Text>
            <View style={s.line} />
          </View>

          <Text style={{ color: c.muted, fontSize: 13, marginBottom: 6 }}>{t("location.country")}</Text>
          <Pressable style={s.select} onPress={() => setPicking((p) => !p)}>
            <Text style={{ color: c.text, flex: 1, fontSize: 16 }}>{countryName(country, i18n.language)}</Text>
            <Ionicons name={picking ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
          </Pressable>
          {picking && (
            <View style={{ maxHeight: 280, borderWidth: 1, borderColor: c.border, borderRadius: 12, marginTop: 6, overflow: "hidden" }}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {countryOptions(i18n.language, country).map((o) => (
                  <Pressable key={o.code} style={s.option} onPress={() => { setCountry(o.code); setDirty(true); setPicking(false); }}>
                    <Text style={{ color: c.text }}>{o.name}</Text>
                    {o.code === country && <Ionicons name="checkmark" size={18} color={c.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}>
              <Input
                value={zip}
                onChangeText={(v) => { setZip(v); setDirty(true); }}
                placeholder={t("location.zip")}
                autoCapitalize="characters"
                maxLength={12}
                returnKeyType="done"
                onSubmitEditing={apply}
              />
            </View>
            <Button title={t("location.apply")} variant="outline" onPress={apply} />
          </View>

          <Button title={t("location.done")} onPress={() => (dirty ? apply() : close())} style={{ marginTop: 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
