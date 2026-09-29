import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Page, { btnPrimary, inputClass, card } from "@/components/Page";
import { StatusBadge } from "@/components/Orders/OrderStatus";
import useProducts from "@/hooks/useProducts";
import { API_URL } from "@/config/constants";
import { authHeaders, adminGetOrders, adminUpdateOrder, apiError } from "@/api/account";
import { ORDER_STATUSES, formatUSD } from "../../shared/settings";

const EMPTY = { name: "", description: "", price: "", stock: "", image: "", sku: "" };

export default function Admin() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("orders");

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`px-5 py-2 rounded-lg font-semibold ${tab === id ? "bg-cyan-500 text-black" : "border border-zinc-700 text-white"}`}
    >
      {label}
    </button>
  );

  return (
    <Page title={t("admin.title")} width="max-w-7xl" actions={<div className="flex gap-2">{tabBtn("orders", t("admin.ordersTab"))}{tabBtn("products", t("admin.productsTab"))}</div>}>
      {tab === "orders" ? <OrdersAdmin /> : <ProductsAdmin />}
    </Page>
  );
}

function OrdersAdmin() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetOrders()
      .then(setOrders)
      .catch((err) => toast.error(apiError(err, t)))
      .finally(() => setLoading(false));
  }, [t]);

  async function update(order, fields) {
    try {
      const updated = await adminUpdateOrder(order.id, fields);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(apiError(err, t));
    }
  }

  if (loading) return <p className="text-gray-400">{t("common.loading")}</p>;
  if (orders.length === 0) return <p className="text-gray-400">{t("admin.noOrders")}</p>;

  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead className="text-gray-400 border-b border-zinc-800">
          <tr>
            <th className="p-4">#</th>
            <th className="p-4">{t("admin.date")}</th>
            <th className="p-4">{t("orders.items")}</th>
            <th className="p-4">{t("orders.total")}</th>
            <th className="p-4">{t("admin.status")}</th>
            <th className="p-4">{t("orders.trackingNumber")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-zinc-800 last:border-0 align-top">
              <td className="p-4 font-bold">{o.id}</td>
              <td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleString(i18n.language)}</td>
              <td className="p-4">
                {(o.order_items || []).map((i) => <div key={i.id}>{i.product_name} × {i.quantity}</div>)}
                {o.shipping_address && <div className="text-gray-500 text-xs mt-2 max-w-xs">{o.shipping_address}</div>}
              </td>
              <td className="p-4">{formatUSD(o.total, i18n.language)}</td>
              <td className="p-4">
                <div className="mb-2"><StatusBadge status={o.status} /></div>
                <select value={o.status} onChange={(e) => update(o, { status: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.status.${s}`)}</option>)}
                </select>
              </td>
              <td className="p-4">
                <input
                  defaultValue={o.tracking_number || ""}
                  placeholder={t("admin.trackingPlaceholder")}
                  onBlur={(e) => e.target.value !== (o.tracking_number || "") && update(o, { tracking_number: e.target.value })}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-40"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsAdmin() {
  const { t, i18n } = useTranslation();
  const { products, loading } = useProducts();
  const [created, setCreated] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const all = [...created, ...products];
  const totalStock = all.reduce((n, p) => n + Number(p.stock || 0), 0);
  const outOfStock = all.filter((p) => !(p.stock > 0)).length;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/products`, form, { headers: await authHeaders() });
      setCreated((c) => [res.data.data, ...c]);
      setForm(EMPTY);
      toast.success(t("admin.productAdded"));
    } catch (err) {
      toast.error(apiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[[t("admin.products"), all.length], [t("admin.units"), totalStock], [t("admin.outOfStock"), outOfStock]].map(([label, value]) => (
          <div key={label} className={`${card} p-6`}>
            <p className="text-gray-400 m-0">{label}</p>
            <p className="text-3xl font-bold mt-2 mb-0">{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className={`${card} p-6 space-y-3 h-fit`}>
          <h2 className="text-2xl font-bold">{t("admin.addProduct")}</h2>
          <input placeholder={`${t("admin.name")} *`} required value={form.name} onChange={set("name")} className={inputClass} />
          <textarea placeholder={t("admin.description")} rows={3} value={form.description} onChange={set("description")} className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" min="0" placeholder={`${t("admin.price")} (USD) *`} required value={form.price} onChange={set("price")} className={inputClass} />
            <input type="number" min="0" placeholder={t("admin.stock")} value={form.stock} onChange={set("stock")} className={inputClass} />
          </div>
          <input type="url" placeholder={t("admin.imageUrl")} value={form.image} onChange={set("image")} className={inputClass} />
          <input placeholder={t("admin.sku")} value={form.sku} onChange={set("sku")} className={inputClass} />
          <button disabled={saving} className={`${btnPrimary} w-full`}>{saving ? t("common.saving") : t("admin.addProduct")}</button>
        </form>

        <div className={`lg:col-span-2 ${card} overflow-x-auto`}>
          <table className="w-full text-left text-sm">
            <thead className="text-gray-400 border-b border-zinc-800">
              <tr>
                <th className="p-4">{t("admin.product")}</th>
                <th className="p-4">{t("admin.price")}</th>
                <th className="p-4">{t("admin.stock")}</th>
              </tr>
            </thead>
            <tbody>
              {all.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800 last:border-0">
                  <td className="p-4 flex items-center gap-3">
                    <div className="bg-white w-10 h-10 rounded flex items-center justify-center shrink-0">
                      {p.image && <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />}
                    </div>
                    {p.name}
                  </td>
                  <td className="p-4">{formatUSD(p.price, i18n.language)}</td>
                  <td className={`p-4 ${p.stock > 0 ? "" : "text-red-400"}`}>{p.stock ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
