import { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, Pressable, Alert, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../src/lib/admin";
import { errorMessage } from "../../src/lib/api";
import { useShop } from "../../src/store/shop";
import { countryName, flag } from "../../../shared/settings";
import { Button, Input, Card, Toggle, Loading, useStyles } from "../../src/components/ui";

const EMPTY = { name: "", description: "", price: "", sale_price: "", sale_ends_at: "", stock: "", stock_by_country: {}, sku: "", category_id: "", brand_id: "", status: "active", featured: false, images: [] };

// "2026-10-31 23:59" <-> ISO
const toText = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromText = (txt) => {
  if (!txt?.trim()) return null;
  const d = new Date(txt.trim().replace(" ", "T"));
  return isNaN(d) ? null : d.toISOString();
};

function Chips({ items, value, onChange, onCreate, noneLabel, newLabel }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [s, c] = useStyles((c) => ({
    chip: { borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
    on: { backgroundColor: c.primary, borderColor: c.primary },
  }));

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {[{ id: "", name: noneLabel }, ...items].map((it) => {
          const on = String(value ?? "") === String(it.id);
          return (
            <Pressable key={String(it.id)} onPress={() => onChange(it.id)} style={[s.chip, on && s.on]}>
              <Text style={{ color: on ? c.onPrimary : c.text }}>{it.name}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setAdding(!adding)} style={s.chip}>
          <Text style={{ color: c.primary }}>+ {newLabel}</Text>
        </Pressable>
      </View>
      {adding && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput value={name} onChangeText={setName} placeholder={newLabel} placeholderTextColor={c.muted} autoFocus style={{ flex: 1, backgroundColor: c.input, color: c.text, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border }} />
          <Button
            title="OK"
            onPress={async () => {
              if (!name.trim()) return;
              await onCreate(name.trim());
              setName("");
              setAdding(false);
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function AdminProduct() {
  const { t, i18n } = useTranslation();
  const shopSettings = useShop((st) => st.settings);
  const ownStock = Object.entries(shopSettings?.countries || {}).filter(([, cc]) => cc?.enabled && cc.own_stock).map(([code]) => code);
  const { id } = useLocalSearchParams();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ categories: [], brands: [], fields: {} });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 10 },
    label: { color: c.muted, fontSize: 13, marginBottom: 6 },
    photo: { width: 96, height: 96, borderRadius: 12, backgroundColor: "#fff", marginRight: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    add: { width: 96, height: 96, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: c.border, alignItems: "center", justifyContent: "center", gap: 4 },
    pill: { position: "absolute", bottom: 4, left: 4, backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 5 },
    x: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 12, padding: 3 },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  }));

  useEffect(() => {
    adminApi.meta().then(setMeta).catch(() => {});
    if (!isNew) {
      adminApi
        .product(id)
        .then((p) =>
          setForm({
            ...EMPTY,
            ...p,
            price: p.price != null ? String(p.price) : "",
            stock: p.stock != null ? String(p.stock) : "",
            stock_by_country: Object.fromEntries(Object.entries(p.stock_by_country || {}).map(([k, v]) => [k, String(v)])),
            sale_price: p.sale_price != null ? String(p.sale_price) : "",
            sale_ends_at: toText(p.sale_ends_at),
            category_id: p.category_id ?? "",
            brand_id: p.brand_id ?? "",
            images: p.images?.length ? p.images : p.image ? [p.image] : [],
          })
        )
        .catch((e) => Alert.alert(t("common.error"), errorMessage(e, t)))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, t]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function addPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.6,
      base64: true,
    });
    if (res.canceled) return;
    setUploading(true);
    try {
      const urls = [];
      for (const a of res.assets) {
        if (a.base64) urls.push(await adminApi.upload(a.base64, a.mimeType || "image/jpeg"));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name || form.price === "") return Alert.alert(`${t("admin.name")}, ${t("admin.price")}`);
    setSaving(true);
    const payload = { ...form, image: form.images[0] || null, sale_ends_at: fromText(form.sale_ends_at) };
    if (!meta.fields.images) delete payload.images;
    try {
      if (isNew) await adminApi.create(payload);
      else await adminApi.update(id, payload);
      router.back();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  function askDelete() {
    Alert.alert(t("admin.deleteConfirm"), form.name, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const res = await adminApi.remove(id);
            Alert.alert(res.hidden ? t("admin.hiddenInstead") : t("admin.deleted"));
            router.back();
          } catch (e) {
            Alert.alert(t("common.error"), errorMessage(e, t));
          }
        },
      },
    ]);
  }

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: isNew ? t("admin.newProduct") : t("admin.editProduct") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={s.h2}>{t("admin.photos")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {form.images.map((url, i) => (
              <Pressable
                key={url}
                style={s.photo}
                onPress={() => i > 0 && setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }))}
              >
                <Image source={{ uri: url }} style={{ width: "90%", height: "90%" }} resizeMode="contain" />
                {i === 0 && (
                  <View style={s.pill}><Text style={{ color: c.onPrimary, fontSize: 10, fontWeight: "800" }}>{t("admin.mainPhoto")}</Text></View>
                )}
                <Pressable style={s.x} hitSlop={8} onPress={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </Pressable>
            ))}
            <Pressable style={s.add} onPress={addPhotos} disabled={uploading}>
              <Ionicons name="images-outline" size={26} color={c.muted} />
              <Text style={{ color: c.muted, fontSize: 11, textAlign: "center" }}>{uploading ? t("admin.uploading") : t("admin.addPhotos")}</Text>
            </Pressable>
          </ScrollView>
          {form.images.length > 1 && <Text style={[s.label, { marginTop: 8 }]}>{t("admin.setMain")} ↔</Text>}
          {!meta.fields.images && form.images.length > 1 && (
            <Text style={{ color: c.warning, fontSize: 12, marginTop: 6 }}>{t("admin.photosNeedSql")}</Text>
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <Input label={`${t("admin.name")} *`} value={form.name} onChangeText={set("name")} />
          <Input label={t("admin.description")} value={form.description || ""} onChangeText={set("description")} multiline style={{ minHeight: 100, textAlignVertical: "top" }} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Input label={`${t("admin.price")} (USD) *`} value={form.price} onChangeText={set("price")} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Input label={ownStock.length ? t("countries.mainStock") : t("admin.stock")} value={form.stock} onChangeText={set("stock")} keyboardType="number-pad" /></View>
          </View>
          {ownStock.map((code) => (
            <Input
              key={code}
              label={t("countries.stockIn", { country: `${flag(code)} ${countryName(code, i18n.language)}` })}
              value={form.stock_by_country?.[code] ?? ""}
              onChangeText={(v) => setForm((f) => ({ ...f, stock_by_country: { ...(f.stock_by_country || {}), [code]: v } }))}
              keyboardType="number-pad"
            />
          ))}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Input label={t("admin.salePrice")} value={form.sale_price} onChangeText={set("sale_price")} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Input label={t("admin.saleEnds")} value={form.sale_ends_at} onChangeText={set("sale_ends_at")} placeholder="2026-10-31 23:59" autoCorrect={false} /></View>
          </View>
          <Text style={{ color: c.muted, fontSize: 12 }}>{t("admin.saleHelp")}</Text>
          <Input label={t("admin.sku")} value={form.sku || ""} onChangeText={set("sku")} autoCapitalize="characters" />
        </Card>

        {(meta.fields.category || meta.fields.brand) && (
          <Card style={{ gap: 14 }}>
            {meta.fields.category && (
              <View>
                <Text style={s.label}>{t("admin.category")}</Text>
                <Chips
                  items={meta.categories}
                  value={form.category_id}
                  onChange={set("category_id")}
                  noneLabel={t("admin.none")}
                  newLabel={t("admin.newCategory")}
                  onCreate={async (name) => {
                    const item = await adminApi.createCategory(name);
                    setMeta((m) => ({ ...m, categories: [...m.categories, item] }));
                    set("category_id")(item.id);
                  }}
                />
              </View>
            )}
            {meta.fields.brand && (
              <View>
                <Text style={s.label}>{t("admin.brand")}</Text>
                <Chips
                  items={meta.brands}
                  value={form.brand_id}
                  onChange={set("brand_id")}
                  noneLabel={t("admin.none")}
                  newLabel={t("admin.newBrand")}
                  onCreate={async (name) => {
                    const item = await adminApi.createBrand(name);
                    setMeta((m) => ({ ...m, brands: [...m.brands, item] }));
                    set("brand_id")(item.id);
                  }}
                />
              </View>
            )}
          </Card>
        )}

        {(meta.fields.status || meta.fields.featured) && (
          <Card>
            {meta.fields.status && (
              <View style={s.toggleRow}>
                <Text style={{ color: c.text, fontSize: 16 }}>{t("admin.visible")}</Text>
                <Toggle value={form.status === "active"} onValueChange={(v) => set("status")(v ? "active" : "draft")} />
              </View>
            )}
            {meta.fields.featured && (
              <View style={s.toggleRow}>
                <Text style={{ color: c.text, fontSize: 16 }}>{t("admin.featured")}</Text>
                <Toggle value={!!form.featured} onValueChange={set("featured")} />
              </View>
            )}
          </Card>
        )}

        <Button title={t("common.save")} onPress={save} loading={saving} disabled={uploading} />
        {!isNew && <Button title={t("admin.deleteProduct")} variant="danger" icon="trash-outline" onPress={askDelete} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
