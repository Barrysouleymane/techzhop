import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User, Camera } from "lucide-react";
import Page, { Field, btnPrimary, btnSecondary, inputClass, card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import { getProfile, updateProfile, uploadAvatar } from "@/api/account";

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      if (!p) return;
      setForm({ full_name: p.full_name || "", phone: p.phone || "" });
      setAvatar(p.avatar_url || null);
    });
  }, [user]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setAvatar(await uploadAvatar(user.id, file));
    } catch {
      toast.error(t("profile.uploadError"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removePhoto() {
    await updateProfile(user.id, { avatar_url: null });
    setAvatar(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(user.id, form);
      toast.success(t("common.saved"));
      navigate("/account");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page title={t("profile.title")} width="max-w-xl" back="/account" backLabel={t("account.title")}>
      <form onSubmit={handleSubmit} className={`${card} p-6 sm:p-8 space-y-5`}>
        <div className="flex items-center gap-5">
          {avatar ? (
            <img src={avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center text-black"><User size={44} /></div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={btnSecondary}>
              <Camera className="w-4 h-4" /> {uploading ? t("common.saving") : t("profile.changePhoto")}
            </button>
            {avatar && (
              <button type="button" onClick={removePhoto} className="text-red-400 text-sm text-left">{t("profile.removePhoto")}</button>
            )}
          </div>
        </div>

        <Field label={t("profile.email")} hint={t("profile.emailNote")}>
          <input value={user?.email || ""} disabled className={`${inputClass} opacity-60`} />
        </Field>
        <Field label={t("profile.fullName")}>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("profile.phone")}>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button disabled={saving} className={btnPrimary}>{saving ? t("common.saving") : t("common.save")}</button>
          <button type="button" onClick={() => navigate("/account")} className={btnSecondary}>{t("common.cancel")}</button>
        </div>
      </form>
    </Page>
  );
}
