import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Page, { btnPrimary, inputClass, card } from "@/components/Page";

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleRegister(e) {
    e.preventDefault();
    if (form.password.length < 6) return toast.error(t("auth.passwordTooShort"));
    if (form.password !== form.confirm) return toast.error(t("auth.passwordsNoMatch"));

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, language: i18n.language },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success(t("auth.accountCreated"));
    navigate(data.session ? "/account" : "/login");
  }

  return (
    <Page width="max-w-md">
      <form onSubmit={handleRegister} className={`${card} p-8 space-y-4`}>
        <h1 className="text-3xl text-cyan-400 font-bold text-center mb-4">{t("auth.registerTitle")}</h1>
        <input required autoComplete="name" placeholder={t("auth.fullName")} value={form.name} onChange={set("name")} className={inputClass} />
        <input type="email" required autoComplete="email" placeholder={t("auth.email")} value={form.email} onChange={set("email")} className={inputClass} />
        <input type="password" required autoComplete="new-password" placeholder={t("auth.password")} value={form.password} onChange={set("password")} className={inputClass} />
        <input type="password" required autoComplete="new-password" placeholder={t("auth.confirmPassword")} value={form.confirm} onChange={set("confirm")} className={inputClass} />
        <button disabled={busy} className={`${btnPrimary} w-full py-4 text-lg`}>{t("auth.register")}</button>
        <p className="text-center text-gray-400 mb-0">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="text-cyan-400 no-underline">{t("auth.login")}</Link>
        </p>
      </form>
    </Page>
  );
}
