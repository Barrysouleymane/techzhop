import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Page, { btnPrimary, inputClass, card } from "@/components/Page";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <Page width="max-w-md" back="/login" backLabel={t("auth.login")}>
      <form onSubmit={handleSubmit} className={`${card} p-8 space-y-4`}>
        <h1 className="text-3xl font-bold">{t("auth.forgotTitle")}</h1>
        {sent ? (
          <p className="text-green-400">{t("auth.linkSent")}</p>
        ) : (
          <>
            <p className="text-gray-400">{t("auth.forgotText")}</p>
            <input type="email" required placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <button disabled={busy} className={`${btnPrimary} w-full`}>{t("auth.sendLink")}</button>
          </>
        )}
        <Link to="/login" className="block text-center text-cyan-400 no-underline">{t("auth.login")}</Link>
      </form>
    </Page>
  );
}
