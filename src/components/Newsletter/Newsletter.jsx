import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/api/account";

export default function Newsletter() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await subscribeNewsletter(email, i18n.language);
      setEmail("");
      toast.success(t("home.subscribed"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-cyan-600 py-16 px-6 text-center" style={{ color: "#fff" }}>
      <h2 className="text-3xl sm:text-4xl font-bold">{t("home.newsletterTitle")}</h2>
      <p className="mt-3">{t("home.newsletterText")}</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("home.newsletterPlaceholder")}
          className="flex-1 px-4 py-3 rounded-lg outline-none"
          style={{ background: "#fff", color: "#18181b" }}
        />
        <button disabled={busy} className="bg-black hover:bg-zinc-900 px-6 py-3 rounded-lg font-bold disabled:opacity-60" style={{ color: "#fff", background: "#000" }}>
          {t("home.subscribe")}
        </button>
      </form>
    </section>
  );
}
