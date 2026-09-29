import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BadgeCheck, Trash2 } from "lucide-react";
import Stars from "./Stars";
import { btnPrimary, inputClass, card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import useShopStore from "@/store/shopStore";
import { getReviews, canReview, postReview, deleteReview } from "@/api/reviews";
import { apiError } from "@/api/account";

export default function Reviews({ productId }) {
  const { t, i18n } = useTranslation();
  const { user, can } = useAuth();
  const reloadShop = useShopStore((s) => s.load);
  const [reviews, setReviews] = useState([]);
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [busy, setBusy] = useState(false);

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

  async function submit(e) {
    e.preventDefault();
    if (!form.rating) return toast.error(t("product.pickRating"));
    setBusy(true);
    try {
      await postReview(productId, form);
      toast.success(t("product.reviewPosted"));
      await load();
      reloadShop(true);
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    await deleteReview(id).catch((err) => toast.error(apiError(err, t)));
    load();
    reloadShop(true);
  }

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-2">{t("product.reviews")}</h2>
      <div className="flex items-center gap-3 mb-8">
        <Stars value={avg} size={22} />
        <span className="text-gray-400">
          {reviews.length ? `${avg.toFixed(1)} / 5 · ${t("product.reviewsCount", { count: reviews.length })}` : t("product.noReviews")}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={r.rating} size={16} />
                {r.title && <strong>{r.title}</strong>}
              </div>
              <p className="text-gray-500 text-sm mt-1 mb-2 flex items-center gap-2">
                {r.author_name} · {new Date(r.created_at).toLocaleDateString(i18n.language)}
                <span className="inline-flex items-center gap-1 text-green-400"><BadgeCheck className="w-4 h-4" /> {t("product.verified")}</span>
              </p>
              {r.body && <p className="text-gray-300 whitespace-pre-line m-0">{r.body}</p>}
              {(r.user_id === user?.id || can("products")) && (
                <button onClick={() => remove(r.id)} className="mt-3 inline-flex items-center gap-1 text-red-400 text-sm">
                  <Trash2 className="w-4 h-4" /> {t("product.deleteReview")}
                </button>
              )}
            </article>
          ))}
        </div>

        <div>
          {allowed ? (
            <form onSubmit={submit} className={`${card} p-5 space-y-3`}>
              <h3 className="text-lg font-bold m-0">{t("product.writeReview")}</h3>
              <div>
                <span className="text-gray-400 text-sm block mb-1">{t("product.yourRating")}</span>
                <Stars value={form.rating} size={28} onChange={(rating) => setForm({ ...form, rating })} />
              </div>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("product.reviewTitle")} className={inputClass} maxLength={120} />
              <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={t("product.reviewBody")} className={inputClass} maxLength={2000} />
              <button disabled={busy} className={`${btnPrimary} w-full`}>{t("product.submitReview")}</button>
            </form>
          ) : (
            <p className="text-gray-500 text-sm">{t("product.onlyBuyers")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
