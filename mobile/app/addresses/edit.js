import { useEffect, useState } from "react";
import { ScrollView, Alert, View, Text, Pressable, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import useAuth from "../../src/lib/useAuth";
import { getAddress, saveAddress, errorMessage } from "../../src/lib/api";
import { Button, Input, Card, Toggle, useStyles } from "../../src/components/ui";
import { useShop } from "../../src/store/shop";
import { useDeliveryLocation } from "../../src/store/location";
import { countryOptions, countryName, normalizeCountry, needsLandmark, sellingCountries, flag } from "../../../shared/settings";

const EMPTY = { label: "", full_name: "", phone: "", line1: "", line2: "", neighborhood: "", landmark: "", city: "", state: "", postal_code: "", country: "", latitude: null, longitude: null, is_default: false };

export default function EditAddress() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const settings = useShop((st) => st.settings);
  const here = useDeliveryLocation();
  const [a, setA] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [s, c] = useStyles((c) => ({
    select: { flexDirection: "row", alignItems: "center", backgroundColor: c.input, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 13 },
    option: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  }));

  useEffect(() => {
    if (id) {
      getAddress(id).then((x) => setA({ ...EMPTY, ...x, country: normalizeCountry(x.country) })).catch(() => {});
    } else {
      const selling = sellingCountries(settings);
      setA((x) => ({ ...x, country: selling.includes(here.country) ? here.country : selling[0] || "US" }));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setA({ ...a, [k]: v });
  const opt = (label) => `${label} (${t("common.optional")})`;
  const africa = needsLandmark(a.country);

  async function locate() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("denied");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setA((x) => ({ ...x, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
    } catch {
      Alert.alert(t("addresses.locationError"));
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    const missing = !a.full_name || !a.line1 || !a.city || !a.country || (africa && (!a.phone || !a.neighborhood || !a.landmark));
    if (missing) {
      const fields = [t("addresses.fullName"), t("addresses.line1"), t("addresses.city"), t("addresses.country")];
      if (africa) fields.push(t("addresses.phone"), t("addresses.neighborhood"), t("addresses.landmark"));
      return Alert.alert(fields.join(", "));
    }
    setSaving(true);
    try {
      const payload = { ...a, country: normalizeCountry(a.country) };
      // New fields are only sent when filled (works before the "countries" SQL is run)
      for (const k of ["neighborhood", "landmark", "latitude", "longitude"]) if (payload[k] === "" || payload[k] == null) delete payload[k];
      await saveAddress(user.id, payload);
      router.back();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  const selling = sellingCountries(settings);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: id ? t("addresses.edit") : t("addresses.add") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t("addresses.country")}</Text>
            <Pressable style={s.select} onPress={() => setPicking(true)}>
              <Text style={{ color: c.text, flex: 1, fontSize: 16 }}>{a.country ? `${flag(a.country)} ${countryName(a.country, i18n.language)}` : "—"}</Text>
              <Ionicons name="chevron-down" size={18} color={c.muted} />
            </Pressable>
          </View>
          <Input label={opt(t("addresses.label"))} placeholder={t("addresses.labelPlaceholder")} value={a.label || ""} onChangeText={set("label")} />
          <Input label={t("addresses.fullName")} value={a.full_name} onChangeText={set("full_name")} autoComplete="name" />
          <Input
            label={africa ? t("addresses.phone") : opt(t("addresses.phone"))}
            hint={africa ? t("addresses.phoneHint") : undefined}
            value={a.phone || ""}
            onChangeText={set("phone")}
            keyboardType="phone-pad"
            placeholder={africa ? "+224 6xx xx xx xx" : ""}
          />
          <Input label={africa ? t("addresses.line1Africa") : t("addresses.line1")} value={a.line1} onChangeText={set("line1")} autoComplete="address-line1" />
          {africa ? (
            <>
              <Input label={t("addresses.neighborhood")} value={a.neighborhood || ""} onChangeText={set("neighborhood")} placeholder="Kaloum, Ratoma, Matoto…" />
              <Input label={t("addresses.city")} value={a.city} onChangeText={set("city")} placeholder="Conakry" />
              <Input label={t("addresses.landmark")} hint={t("addresses.landmarkHint")} value={a.landmark || ""} onChangeText={set("landmark")} placeholder={t("addresses.landmarkPlaceholder")} />
              <Button title={t("addresses.useLocation")} icon="locate-outline" variant="outline" onPress={locate} loading={locating} />
              {a.latitude != null ? <Text style={{ color: c.success }}>✓ {t("addresses.locationSaved")}</Text> : null}
            </>
          ) : (
            <>
              <Input label={opt(t("addresses.line2"))} value={a.line2 || ""} onChangeText={set("line2")} />
              <Input label={t("addresses.city")} value={a.city} onChangeText={set("city")} />
              <Input label={opt(t("addresses.state"))} value={a.state || ""} onChangeText={set("state")} />
              <Input label={opt(t("addresses.postalCode"))} value={a.postal_code || ""} onChangeText={set("postal_code")} autoComplete="postal-code" />
            </>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: c.text, fontSize: 16 }}>{t("addresses.setDefault")}</Text>
            <Toggle value={!!a.is_default} onValueChange={set("is_default")} />
          </View>
        </Card>
        <Button title={t("common.save")} onPress={save} loading={saving} />
      </ScrollView>

      <Modal visible={picking} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>{t("addresses.country")}</Text>
            <Pressable onPress={() => setPicking(false)} hitSlop={12}><Ionicons name="close" size={26} color={c.text} /></Pressable>
          </View>
          <ScrollView>
            {countryOptions(i18n.language, a.country).map((o) => (
              <Pressable key={o.code} style={s.option} onPress={() => { setA({ ...a, country: o.code }); setPicking(false); }}>
                <Text style={{ color: c.text, fontSize: 16 }}>
                  {flag(o.code)} {o.name}{selling.includes(o.code) ? "" : ` · ${t("addresses.notDelivered")}`}
                </Text>
                {o.code === a.country ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
