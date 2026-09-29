import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Page, { btnPrimary, inputClass, card } from "@/components/Page";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate(location.state?.from || "/account", { replace: true });
  }

  return (
    <Page width="max-w-md">
      <form onSubmit={handleLogin} className={`${card} p-8 space-y-4`}>
        <h1 className="text-3xl text-cyan-400 font-bold text-center mb-4">{t("auth.loginTitle")}</h1>
        <input type="email" required autoComplete="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <input type="password" required autoComplete="current-password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-cyan-400 text-sm no-underline">{t("auth.forgot")}</Link>
        </div>
        <button disabled={busy} className={`${btnPrimary} w-full py-4 text-lg`}>{t("auth.login")}</button>
        <p className="text-center text-gray-400 mb-0">
          {t("auth.noAccount")}{" "}
          <Link to="/register" state={location.state} className="text-cyan-400 no-underline">{t("auth.register")}</Link>
        </p>
      </form>
    </Page>
  );
}
