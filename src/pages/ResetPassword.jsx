import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Page, { btnPrimary, inputClass, card } from "@/components/Page";

// The link in the reset email opens this page with a recovery session.
export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => {
      if (d.session) setReady(true);
      setTimeout(() => setChecked(true), 1500);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error(t("auth.passwordTooShort"));
    if (password !== confirm) return toast.error(t("auth.passwordsNoMatch"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.passwordUpdated"));
    navigate("/account");
  }

  return (
    <Page width="max-w-md">
      <div className={`${card} p-8 space-y-4`}>
        <h1 className="text-3xl font-bold">{t("auth.resetTitle")}</h1>
        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" required autoComplete="new-password" placeholder={t("auth.newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="new-password" placeholder={t("auth.confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
            <button disabled={busy} className={`${btnPrimary} w-full`}>{t("auth.updatePassword")}</button>
          </form>
        ) : checked ? (
          <>
            <p className="text-red-400">{t("auth.invalidLink")}</p>
            <Link to="/forgot-password" className={btnPrimary}>{t("auth.sendLink")}</Link>
          </>
        ) : (
          <p className="text-gray-400">{t("common.loading")}</p>
        )}
      </div>
    </Page>
  );
}
