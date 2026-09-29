import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Page, { Field, btnPrimary, btnDanger, inputClass, card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import { changePassword, deleteMyAccount, apiError } from "@/api/account";

export default function Security() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { user } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  async function handlePassword(e) {
    e.preventDefault();
    if (pw.next.length < 6) return toast.error(t("auth.passwordTooShort"));
    if (pw.next !== pw.confirm) return toast.error(t("auth.passwordsNoMatch"));
    setBusy(true);
    try {
      await changePassword(user.email, pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast.success(t("security.updated"));
    } catch (err) {
      toast.error(err.code === "WRONG_PASSWORD" ? t("security.wrongPassword") : apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success(t("security.deleted"));
      navigate("/");
    } catch (err) {
      toast.error(apiError(err, t));
      setDeleting(false);
    }
  }

  const set = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  return (
    <Page title={t("security.title")} width="max-w-2xl" back="/account" backLabel={t("account.title")}>
      <form onSubmit={handlePassword} className={`${card} p-6 space-y-4 mb-8`}>
        <h2 className="text-xl font-bold">{t("security.changePassword")}</h2>
        <Field label={t("security.currentPassword")}><input type="password" required autoComplete="current-password" value={pw.current} onChange={set("current")} className={inputClass} /></Field>
        <Field label={t("security.newPassword")}><input type="password" required autoComplete="new-password" value={pw.next} onChange={set("next")} className={inputClass} /></Field>
        <Field label={t("security.confirmPassword")}><input type="password" required autoComplete="new-password" value={pw.confirm} onChange={set("confirm")} className={inputClass} /></Field>
        <button disabled={busy} className={btnPrimary}>{busy ? t("common.saving") : t("security.update")}</button>
      </form>

      <div id="delete" className="border border-red-700 bg-red-900/20 rounded-xl p-6 space-y-4 scroll-mt-28">
        <h2 className="text-xl font-bold text-red-400">{t("security.deleteTitle")}</h2>
        <p className="text-gray-300">{t("security.deleteText")}</p>
        <Field label={t("security.deleteConfirmLabel")}>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        <button onClick={handleDelete} disabled={confirmText !== "DELETE" || deleting} className={btnDanger}>
          {deleting ? t("common.loading") : t("security.deleteButton")}
        </button>
      </div>
    </Page>
  );
}
