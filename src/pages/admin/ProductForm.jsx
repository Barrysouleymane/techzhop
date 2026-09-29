import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, Star, X, Trash2 } from "lucide-react";
import Page, { Field, btnPrimary, btnSecondary, btnDanger, inputClass, card } from "@/components/Page";
import { adminApi } from "@/api/admin";
import { apiError } from "@/api/account";

const EMPTY = { name: "", description: "", price: "", sale_price: "", sale_ends_at: "", stock: "", sku: "", category_id: "", brand_id: "", status: "active", featured: false, images: [] };

// ISO date → value for <input type="datetime-local">
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function ProductForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ categories: [], brands: [], fields: {} });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminApi.meta().then(setMeta).catch((err) => toast.error(apiError(err, t)));
    if (!isNew) {
      adminApi
        .product(id)
        .then((p) =>
          setForm({
            ...EMPTY,
            ...p,
            price: p.price ?? "",
            stock: p.stock ?? "",
            sale_price: p.sale_price ?? "",
            sale_ends_at: toLocalInput(p.sale_ends_at),
            category_id: p.category_id ?? "",
            brand_id: p.brand_id ?? "",
            images: p.images?.length ? p.images : p.image ? [p.image] : [],
          })
        )
        .catch((err) => toast.error(apiError(err, t)))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, t]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function addPhotos(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await adminApi.upload(f));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setUploading(false);
    }
  }

  const removePhoto = (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  const makeMain = (url) => setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));

  async function quickCreate(kind) {
    const name = window.prompt(t(kind === "category" ? "admin.newCategory" : "admin.newBrand"));
    if (!name?.trim()) return;
    try {
      const item = kind === "category" ? await adminApi.createCategory(name) : await adminApi.createBrand(name);
      setMeta((m) => ({ ...m, [kind === "category" ? "categories" : "brands"]: [...m[kind === "category" ? "categories" : "brands"], item] }));
      setForm((f) => ({ ...f, [`${kind}_id`]: item.id }));
    } catch (err) {
      toast.error(apiError(err, t));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      image: form.images[0] || null,
      sale_ends_at: form.sale_ends_at ? new Date(form.sale_ends_at).toISOString() : null,
    };
    if (!meta.fields.images) delete payload.images;
    try {
      if (isNew) await adminApi.create(payload);
      else await adminApi.update(id, payload);
      toast.success(t("admin.saved"));
      navigate("/admin");
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    try {
      const res = await adminApi.remove(id);
      toast.success(res.hidden ? t("admin.hiddenInstead") : t("admin.deleted"));
      navigate("/admin");
    } catch (err) {
      toast.error(apiError(err, t));
    }
  }

  if (loading) return <Page><p className="text-gray-400">{t("common.loading")}</p></Page>;

  const select = inputClass;

  return (
    <Page title={isNew ? t("admin.newProduct") : t("admin.editProduct")} width="max-w-4xl" back="/admin" backLabel={t("admin.title")}>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
        {/* PHOTOS */}
        <div className={`${card} p-5 lg:col-span-2 h-fit`}>
          <h2 className="text-lg font-bold mb-3">{t("admin.photos")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {form.images.map((url, i) => (
              <div key={url} className="relative bg-white rounded-lg aspect-square flex items-center justify-center overflow-hidden group">
                <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                {i === 0 ? (
                  <span className="absolute bottom-1 left-1 bg-cyan-500 text-black text-[10px] font-bold rounded px-1">{t("admin.mainPhoto")}</span>
                ) : (
                  <button type="button" onClick={() => makeMain(url)} title={t("admin.setMain")} className="absolute bottom-1 left-1 bg-black/70 rounded p-1"><Star className="w-3 h-3 text-white" /></button>
                )}
                <button type="button" onClick={() => removePhoto(url)} title={t("admin.removePhoto")} className="absolute top-1 right-1 bg-black/70 rounded-full p-1"><X className="w-3 h-3 text-white" /></button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-gray-400 hover:border-cyan-500 hover:text-cyan-400 text-xs gap-1">
              <ImagePlus className="w-6 h-6" />
              {uploading ? t("admin.uploading") : t("admin.addPhotos")}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
          {!meta.fields.images && form.images.length > 1 && (
            <p className="text-yellow-400 text-xs mt-3 mb-0">{t("admin.photosNeedSql")}</p>
          )}
        </div>

        {/* DETAILS */}
        <div className={`${card} p-5 lg:col-span-3 space-y-4`}>
          <Field label={`${t("admin.name")} *`}><input required value={form.name} onChange={set("name")} className={inputClass} /></Field>
          <Field label={t("admin.description")}><textarea rows={5} value={form.description || ""} onChange={set("description")} className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t("admin.price")} (USD) *`}><input type="number" step="0.01" min="0" required value={form.price} onChange={set("price")} className={inputClass} /></Field>
            <Field label={t("admin.stock")}><input type="number" min="0" value={form.stock} onChange={set("stock")} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("admin.salePrice")}><input type="number" step="0.01" min="0" value={form.sale_price} onChange={set("sale_price")} className={inputClass} /></Field>
            <Field label={t("admin.saleEnds")}><input type="datetime-local" value={form.sale_ends_at} onChange={set("sale_ends_at")} className={inputClass} /></Field>
          </div>
          <p className="text-gray-500 text-xs -mt-2">{t("admin.saleHelp")}</p>
          <Field label={t("admin.sku")}><input value={form.sku || ""} onChange={set("sku")} className={inputClass} /></Field>

          {meta.fields.category && (
            <Field label={t("admin.category")}>
              <div className="flex gap-2">
                <select value={form.category_id} onChange={set("category_id")} className={select}>
                  <option value="">{t("admin.none")}</option>
                  {meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => quickCreate("category")} className={btnSecondary}>+</button>
              </div>
            </Field>
          )}

          {meta.fields.brand && (
            <Field label={t("admin.brand")}>
              <div className="flex gap-2">
                <select value={form.brand_id} onChange={set("brand_id")} className={select}>
                  <option value="">{t("admin.none")}</option>
                  {meta.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="button" onClick={() => quickCreate("brand")} className={btnSecondary}>+</button>
              </div>
            </Field>
          )}

          {meta.fields.status && (
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={form.status === "active"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "draft" })} />
              {t("admin.visible")}
            </label>
          )}
          {meta.fields.featured && (
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={!!form.featured} onChange={set("featured")} />
              {t("admin.featured")}
            </label>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button disabled={saving || uploading} className={btnPrimary}>{saving ? t("common.saving") : t("common.save")}</button>
            <button type="button" onClick={() => navigate("/admin")} className={btnSecondary}>{t("common.cancel")}</button>
            {!isNew && (
              <button type="button" onClick={handleDelete} className={`${btnDanger} ml-auto`}><Trash2 className="w-4 h-4" /> {t("admin.deleteProduct")}</button>
            )}
          </div>
        </div>
      </form>
    </Page>
  );
}
