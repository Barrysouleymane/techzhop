import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Field, btnPrimary, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";

const EMPTY = { image: "", title: "", subtitle: "", link: "", button_label: "", active: true, sort: 0 };

export default function Banners() {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = () => adminApi.banners().then(setList).catch((err) => toast.error(apiError(err, t)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      setForm((f) => ({ ...f, image: "" }));
      const url = await adminApi.upload(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    if (!form.image) return toast.error(t("admin.bannerImage"));
    setBusy(true);
    try {
      await adminApi.createBanner({ ...form, sort: Number(form.sort) || 0 });
      setForm(EMPTY);
      toast.success(t("common.saved"));
      load();
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function patch(b, fields) {
    await adminApi.updateBanner(b.id, fields).catch((err) => toast.error(apiError(err, t)));
    load();
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form onSubmit={create} className={`${card} p-6 space-y-3 h-fit`}>
        <h2 className="text-xl font-bold m-0">{t("admin.newBanner")}</h2>
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full aspect-[16/7] rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden text-gray-400 hover:border-cyan-500">
          {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : (
            <span className="flex flex-col items-center gap-1"><ImagePlus className="w-7 h-7" />{busy ? t("admin.uploading") : t("admin.bannerImage")}</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        <input value={form.title} onChange={set("title")} placeholder={t("admin.bannerTitle")} className={inputClass} />
        <input value={form.subtitle} onChange={set("subtitle")} placeholder={t("admin.bannerSubtitle")} className={inputClass} />
        <input value={form.link} onChange={set("link")} placeholder={t("admin.bannerLink")} className={inputClass} />
        <input value={form.button_label} onChange={set("button_label")} placeholder={t("admin.bannerButton")} className={inputClass} />
        <Field label={t("admin.sortOrder")}><input type="number" value={form.sort} onChange={set("sort")} className={inputClass} /></Field>
        <button disabled={busy} className={`${btnPrimary} w-full`}>{t("admin.create")}</button>
      </form>

      <div className="lg:col-span-2 space-y-4">
        {list.length === 0 && <p className="text-gray-400">{t("admin.noBanners")}</p>}
        {list.map((b) => (
          <div key={b.id} className={`${card} overflow-hidden flex flex-col sm:flex-row`}>
            <img src={b.image} alt="" className="sm:w-64 h-36 object-cover" />
            <div className="p-4 flex-1 space-y-2">
              <strong className="block">{b.title || "—"}</strong>
              {b.subtitle && <p className="text-gray-400 text-sm m-0">{b.subtitle}</p>}
              {b.link && <p className="text-cyan-400 text-xs m-0 break-all">{b.link}</p>}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-cyan-500" checked={b.active} onChange={(e) => patch(b, { active: e.target.checked })} /> {t("admin.active")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  {t("admin.sortOrder")}
                  <input type="number" defaultValue={b.sort} onBlur={(e) => Number(e.target.value) !== b.sort && patch(b, { sort: Number(e.target.value) })} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white" />
                </label>
                <button onClick={async () => { await adminApi.deleteBanner(b.id); load(); }} className="ml-auto text-red-400 inline-flex items-center gap-1 text-sm">
                  <Trash2 className="w-4 h-4" /> {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
