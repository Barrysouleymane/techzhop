import { useEffect, useState } from "react";
import { ScrollView, View, Image, Pressable, Text, Alert } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import useAuth from "../src/lib/useAuth";
import { getProfile, updateProfile, uploadAvatar, errorMessage } from "../src/lib/api";
import { Button, Input, Card, useStyles } from "../src/components/ui";

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [s, c] = useStyles((c) => ({
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  }));

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      if (!p) return;
      setForm({ full_name: p.full_name || "", phone: p.phone || "" });
      setAvatar(p.avatar_url || null);
    });
  }, [user]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      setAvatar(await uploadAvatar(user.id, result.assets[0]));
    } catch (e) {
      Alert.alert(t("profile.uploadError"), e?.message);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    await updateProfile(user.id, { avatar_url: null });
    setAvatar(null);
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile(user.id, form);
      router.back();
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: "center", gap: 12 }}>
        <Pressable style={s.avatar} onPress={pickPhoto}>
          {avatar ? <Image source={{ uri: avatar }} style={{ width: 100, height: 100 }} /> : <Ionicons name="person" size={50} color={c.onPrimary} />}
        </Pressable>
        <Button title={uploading ? t("common.saving") : t("profile.changePhoto")} variant="outline" icon="camera-outline" onPress={pickPhoto} loading={uploading} />
        {avatar && (
          <Pressable onPress={removePhoto}>
            <Text style={{ color: c.danger }}>{t("profile.removePhoto")}</Text>
          </Pressable>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Input label={t("profile.email")} value={user?.email || ""} editable={false} hint={t("profile.emailNote")} />
        <Input label={t("profile.fullName")} value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} autoComplete="name" />
        <Input label={t("profile.phone")} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" autoComplete="tel" />
      </Card>

      <Button title={t("common.save")} onPress={save} loading={saving} />
    </ScrollView>
  );
}
