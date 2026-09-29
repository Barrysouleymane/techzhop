import { useEffect, useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import useAuth from "../lib/useAuth";
import { getReviews, canReview, postReview, deleteReview, errorMessage } from "../lib/api";
import { useStaff } from "../lib/admin";
import { useShop } from "../store/shop";
import { Stars } from "./Shop";
import { Button, Input, Card, useStyles } from "./ui";

export default function Reviews({ productId }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const staff = useStaff();
  const reloadShop = useShop((s) => s.load);
  const [reviews, setReviews] = useState([]);
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [s, c] = useStyles((c) => ({
    h2: { color: c.text, fontSize: 18, fontWeight: "800" },
    review: { borderTopWidth: 0.5, borderTopColor: c.border, paddingVertical: 12, gap: 4 },
  }));

  const load = () => getReviews(productId).then(setReviews).catch(() => {});
  useEffect(() => {
    load();
    if (user) canReview(productId).then(setAllowed);
  }, [productId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = reviews.find((r) => r.user_id === user?.id);
  useEffect(() => {
    if (mine) setForm({ rating: mine.rating, title: mine.title || "", body: mine.body || "" });
  }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  async function submit() {
    if (!form.rating) return Alert.alert(t("product.pickRating"));
    setBusy(true);
    try {
      await postReview(productId, form);
      Alert.alert(t("product.reviewPosted"));
      await load();
      reloadShop(true);
    } catch (e) {
      Alert.alert(t("common.error"), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Text style={s.h2}>{t("product.reviews")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 4 }}>
          <Stars value={avg} size={18} />
          <Text style={{ color: c.muted }}>
            {reviews.length ? `${avg.toFixed(1)} / 5 · ${t("product.reviewsCount", { count: reviews.length })}` : t("product.noReviews")}
          </Text>
        </View>
        {reviews.map((r) => (
          <View key={r.id} style={s.review}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Stars value={r.rating} size={13} />
              {r.title ? <Text style={{ color: c.text, fontWeight: "700", flexShrink: 1 }}>{r.title}</Text> : null}
            </View>
            <Text style={{ color: c.muted, fontSize: 12 }}>
              {r.author_name} · {new Date(r.created_at).toLocaleDateString(i18n.language)} · <Text style={{ color: c.success }}>✓ {t("product.verified")}</Text>
            </Text>
            {r.body ? <Text style={{ color: c.text, lineHeight: 20 }}>{r.body}</Text> : null}
            {(r.user_id === user?.id || staff.can("products")) && (
              <Pressable onPress={async () => { await deleteReview(r.id).catch(() => {}); load(); reloadShop(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="trash-outline" size={14} color={c.danger} />
                <Text style={{ color: c.danger, fontSize: 13 }}>{t("product.deleteReview")}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Card>

      {allowed ? (
        <Card style={{ gap: 10 }}>
          <Text style={s.h2}>{t("product.writeReview")}</Text>
          <Text style={{ color: c.muted }}>{t("product.yourRating")}</Text>
          <Stars value={form.rating} size={30} onChange={(rating) => setForm({ ...form, rating })} />
          <Input placeholder={t("product.reviewTitle")} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} maxLength={120} />
          <Input placeholder={t("product.reviewBody")} value={form.body} onChangeText={(v) => setForm({ ...form, body: v })} multiline maxLength={2000} style={{ minHeight: 90, textAlignVertical: "top" }} />
          <Button title={t("product.submitReview")} onPress={submit} loading={busy} />
        </Card>
      ) : (
        <Text style={{ color: c.muted, fontSize: 13, marginHorizontal: 4 }}>{t("product.onlyBuyers")}</Text>
      )}
    </View>
  );
}
