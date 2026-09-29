import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/admin";
import { errorMessage } from "../lib/api";
import { useShop } from "../store/shop";
import { Button, Input, Card, Toggle, useStyles } from "./ui";
import { formatUSD } from "../../../shared/settings";

const H2 = ({ children }) => {
  const [s] = useStyles((c) => ({ h: { color: c.text, fontSize: 18, fontWeight: "800" } }));
  return <Text style={s.h}>{children}</Text>;
};

function RemoveBtn({ onPress }) {
  const [, c] = useStyles(() => ({}));
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ justifyContent: "center", paddingHorizontal: 4 }}>
      <Ionicons name="close-circle" size={22} color={c.danger} />
    </Pressable>
  );
}

/* ---------------- Shipping & taxes ---------------- */
export function StoreSettings() {
  const { t } = useTranslation();
  const reload = useShop((s) => s.load);
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, c] = useStyles(() => ({}));

  useEffect(() => {
    adminApi.settings().then((x) => setV(JSON.parse(JSON.stringify(x), (k, val) => (typeof val === "number" ? String(val) : val)))).catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)));
  }, [t]);

  if (!v) return null;
  const sh = (k) => (val) => setV({ ...v, shipping: { ...v.shipping, [k]: val } });
  const zones = v.shipping.zones || [];
  const rates = v.taxes.rates || [];

  async function save() {
    setBusy(true);
    try {
      await adminApi.saveSettings(v);
      reload(true);
      Alert.alert(t("admin.settingsSaved"));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 10 }}>
        <H2>🚚 {t("admin.shippingTitle")}</H2>
        <Input label={t("admin.standardRate")} value={v.shipping.standard_rate} onChangeText={sh("standard_rate")} keyboardType="decimal-pad" />
        <Input label={t("admin.freeOver")} value={v.shipping.free_over} onChangeText={sh("free_over")} keyboardType="decimal-pad" />
        <Text style={{ color: c.muted, fontSize: 13 }}>{t("admin.deliveryDays")}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Input placeholder={t("admin.minDays")} value={v.shipping.min_days} onChangeText={sh("min_days")} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input placeholder={t("admin.maxDays")} value={v.shipping.max_days} onChangeText={sh("max_days")} keyboardType="number-pad" /></View>
        </View>
        <Text style={{ color: c.text, fontWeight: "700", marginTop: 6 }}>{t("admin.zones")}</Text>
        {zones.map((z, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Input placeholder={t("admin.country")} value={z.country} autoCapitalize="characters" onChangeText={(val) => sh("zones")(zones.map((x, n) => (n === i ? { ...x, country: val } : x)))} /></View>
            <View style={{ flex: 1 }}><Input placeholder={t("admin.rate")} value={String(z.rate ?? "")} keyboardType="decimal-pad" onChangeText={(val) => sh("zones")(zones.map((x, n) => (n === i ? { ...x, rate: val } : x)))} /></View>
            <RemoveBtn onPress={() => sh("zones")(zones.filter((_, n) => n !== i))} />
          </View>
        ))}
        <Button title={t("admin.addZone")} variant="outline" icon="add" onPress={() => sh("zones")([...zones, { country: "", rate: "" }])} />
      </Card>

      <Card style={{ gap: 10 }}>
        <H2>🧾 {t("admin.taxesTitle")}</H2>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: c.text, fontSize: 16 }}>{t("admin.taxesEnabled")}</Text>
          <Toggle value={!!v.taxes.enabled} onValueChange={(val) => setV({ ...v, taxes: { ...v.taxes, enabled: val } })} />
        </View>
        <Text style={{ color: c.muted, fontSize: 12 }}>{t("admin.taxHelp")}</Text>
        {rates.map((r, i) => {
          const setR = (k) => (val) => setV({ ...v, taxes: { ...v.taxes, rates: rates.map((x, n) => (n === i ? { ...x, [k]: val } : x)) } });
          return (
            <View key={i} style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ flex: 1 }}><Input placeholder="US" value={r.country} autoCapitalize="characters" onChangeText={setR("country")} /></View>
              <View style={{ flex: 1 }}><Input placeholder="NY" value={r.state || ""} autoCapitalize="characters" onChangeText={setR("state")} /></View>
              <View style={{ flex: 1 }}><Input placeholder="%" value={String(r.rate ?? "")} keyboardType="decimal-pad" onChangeText={setR("rate")} /></View>
              <RemoveBtn onPress={() => setV({ ...v, taxes: { ...v.taxes, rates: rates.filter((_, n) => n !== i) } })} />
            </View>
          );
        })}
        <Button title={t("admin.addRate")} variant="outline" icon="add" onPress={() => setV({ ...v, taxes: { ...v.taxes, rates: [...rates, { country: "US", state: "", rate: "" }] } })} />
      </Card>

      <Button title={t("common.save")} onPress={save} loading={busy} />
    </View>
  );
}

/* ---------------- Banners ---------------- */
export function BannersAdmin() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ image: "", title: "", subtitle: "", link: "", button_label: "" });
  const [busy, setBusy] = useState(false);
  const [, c] = useStyles(() => ({}));

  const load = () => adminApi.banners().then(setList).catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function pick() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true, allowsEditing: true, aspect: [16, 7] });
    if (r.canceled || !r.assets[0].base64) return;
    setBusy(true);
    try {
      const url = await adminApi.upload(r.assets[0].base64, r.assets[0].mimeType || "image/jpeg");
      setForm((f) => ({ ...f, image: url }));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!form.image) return Alert.alert(t("admin.bannerImage"));
    setBusy(true);
    try {
      await adminApi.createBanner({ ...form, sort: list.length });
      setForm({ image: "", title: "", subtitle: "", link: "", button_label: "" });
      load();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 10 }}>
        <H2>{t("admin.newBanner")}</H2>
        <Pressable onPress={pick} style={{ height: 140, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: c.border, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: "100%", height: "100%" }} /> : (
            <Text style={{ color: c.muted }}>{busy ? t("admin.uploading") : `🖼️ ${t("admin.bannerImage")}`}</Text>
          )}
        </Pressable>
        <Input placeholder={t("admin.bannerTitle")} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <Input placeholder={t("admin.bannerSubtitle")} value={form.subtitle} onChangeText={(v) => setForm({ ...form, subtitle: v })} />
        <Input placeholder={t("admin.bannerLink")} value={form.link} onChangeText={(v) => setForm({ ...form, link: v })} autoCapitalize="none" />
        <Input placeholder={t("admin.bannerButton")} value={form.button_label} onChangeText={(v) => setForm({ ...form, button_label: v })} />
        <Button title={t("admin.create")} onPress={create} loading={busy} />
      </Card>

      {list.length === 0 && <Text style={{ color: c.muted }}>{t("admin.noBanners")}</Text>}
      {list.map((b) => (
        <Card key={b.id} style={{ padding: 0, overflow: "hidden" }}>
          <Image source={{ uri: b.image }} style={{ width: "100%", height: 120 }} />
          <View style={{ padding: 12, gap: 8 }}>
            <Text style={{ color: c.text, fontWeight: "700" }}>{b.title || "—"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Toggle value={b.active} onValueChange={async (v) => { await adminApi.updateBanner(b.id, { active: v }); load(); }} />
                <Text style={{ color: c.muted }}>{t("admin.active")}</Text>
              </View>
              <Pressable onPress={async () => { await adminApi.deleteBanner(b.id); load(); }}>
                <Text style={{ color: c.danger }}>{t("common.delete")}</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

/* ---------------- Promo codes ---------------- */
export function PromosAdmin() {
  const { t, i18n } = useTranslation();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code: "", percent_off: "", amount_off: "", expires_at: "", max_redemptions: "" });
  const [busy, setBusy] = useState(false);
  const [, c] = useStyles(() => ({}));

  const load = () => adminApi.promos().then(setList).catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create() {
    setBusy(true);
    try {
      await adminApi.createPromo(form);
      setForm({ code: "", percent_off: "", amount_off: "", expires_at: "", max_redemptions: "" });
      load();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 10 }}>
        <H2>{t("admin.newPromo")}</H2>
        <Input placeholder="SUMMER20" value={form.code} onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })} autoCapitalize="characters" autoCorrect={false} />
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}><Input label={t("admin.percentOff")} value={form.percent_off} keyboardType="number-pad" onChangeText={(v) => setForm({ ...form, percent_off: v, amount_off: "" })} /></View>
          <View style={{ flex: 1 }}><Input label={t("admin.amountOff")} value={form.amount_off} keyboardType="decimal-pad" onChangeText={(v) => setForm({ ...form, amount_off: v, percent_off: "" })} /></View>
        </View>
        <Input label={t("admin.expires")} placeholder="2026-12-31" value={form.expires_at} onChangeText={(v) => setForm({ ...form, expires_at: v })} autoCorrect={false} />
        <Input label={t("admin.maxUses")} value={form.max_redemptions} keyboardType="number-pad" onChangeText={(v) => setForm({ ...form, max_redemptions: v })} />
        <Button title={t("admin.create")} onPress={create} loading={busy} disabled={!form.code} />
      </Card>

      {list.length === 0 && <Text style={{ color: c.muted }}>{t("admin.noPromos")}</Text>}
      {list.map((p) => (
        <Card key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name="pricetag-outline" size={20} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: p.active ? c.text : c.muted, fontWeight: "800", fontFamily: "Courier", textDecorationLine: p.active ? "none" : "line-through" }}>{p.code}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>
              {p.percent_off ? `-${p.percent_off}%` : `-${formatUSD(p.amount_off, i18n.language)}`} · {t("admin.used", { count: p.times_redeemed })}
              {p.expires_at ? ` · ${new Date(p.expires_at).toLocaleDateString(i18n.language)}` : ""}
            </Text>
          </View>
          <Pressable onPress={async () => { await adminApi.setPromoActive(p.id, !p.active).catch(() => {}); load(); }}>
            <Text style={{ color: p.active ? c.danger : c.success }}>{p.active ? t("admin.deactivate") : t("admin.activate")}</Text>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}
