import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import Page, { btnPrimary, card } from "@/components/Page";
import { StatusBadge } from "@/components/Orders/OrderStatus";
import { adminApi } from "@/api/admin";
import useAuth from "@/hooks/useAuth";
import Finances from "@/pages/admin/Finances";
import Team from "@/pages/admin/Team";
import StoreSettings from "@/pages/admin/StoreSettings";
import Banners from "@/pages/admin/Banners";
import Promos from "@/pages/admin/Promos";
import { adminGetOrders, adminUpdateOrder, apiError } from "@/api/account";
import { ORDER_STATUSES, formatUSD, flag } from "../../shared/settings";

export default function Admin() {
  const { t } = useTranslation();
  const { can, role } = useAuth();
  const tabs = [
    can("products") && ["products", t("admin.productsTab")],
    can("orders") && ["orders", t("admin.ordersTab")],
    can("store") && ["store", t("admin.storeTab")],
    can("store") && ["banners", t("admin.bannersTab")],
    can("store") && ["promos", t("admin.promosTab")],
    can("revenue") && ["finances", t("finances.tab")],
    can("team") && ["team", t("team.tab")],
  ].filter(Boolean);
  const [chosen, setTab] = useState(() => sessionStorage.getItem("admin-tab") || "");
  const tab = tabs.some(([id]) => id === chosen) ? chosen : tabs[0]?.[0];

  function select(id) {
    setTab(id);
    sessionStorage.setItem("admin-tab", id);
  }

  const tabBtn = (id, label) => (
    <button
      onClick={() => select(id)}
      className={`px-5 py-2 rounded-lg font-semibold ${tab === id ? "bg-cyan-500 text-black" : "border border-zinc-700 text-white"}`}
    >
      {label}
    </button>
  );

  return (
    <Page title={t("admin.title")} width="max-w-7xl" actions={<span className="text-gray-400">{t(`team.roles.${role}`)}</span>}>
      <Stats />
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(([id, label]) => tabBtn(id, label))}
      </div>
      {tab === "orders" && <OrdersAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "team" && <Team />}
      {tab === "store" && <StoreSettings />}
      {tab === "banners" && <Banners />}
      {tab === "promos" && <Promos />}
      {tab === "finances" && <Finances />}
    </Page>
  );
}

function Stats() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
  }, []);

  const items = [
    stats?.revenue !== null && [t("admin.revenue"), stats ? formatUSD(stats.revenue, i18n.language) : "…"],
    [t("admin.ordersCount"), stats?.orders ?? "…"],
    [t("admin.toShip"), stats?.toShip ?? "…"],
    [t("admin.products"), stats?.products ?? "…"],
    [t("admin.lowStock"), stats?.lowStock ?? "…"],
  ].filter(Boolean);

  return (
    <div className={`grid grid-cols-2 ${items.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"} gap-4 mb-8`}>
      {items.map(([label, value]) => (
        <div key={label} className={`${card} p-5`}>
          <p className="text-gray-400 text-sm m-0">{label}</p>
          <p className="text-2xl font-bold mt-2 mb-0">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductsAdmin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = () =>
    adminApi
      .products()
      .then(setProducts)
      .catch((err) => toast.error(apiError(err, t)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => !q || [p.name, p.sku, p.brands?.name, p.categories?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [products, query]);

  async function handleDelete(p) {
    if (!window.confirm(`${t("admin.deleteConfirm")}\n\n${p.name}`)) return;
    try {
      const res = await adminApi.remove(p.id);
      toast.success(res.hidden ? t("admin.hiddenInstead") : t("admin.deleted"));
      load();
    } catch (err) {
      toast.error(apiError(err, t));
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("admin.search")} className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white" />
        <Link to="/admin/products/new" className={btnPrimary}><Plus className="w-4 h-4" /> {t("admin.newProduct")}</Link>
      </div>

      {loading ? (
        <p className="text-gray-400">{t("common.loading")}</p>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-left text-sm">
            <thead className="text-gray-400 border-b border-zinc-800">
              <tr>
                <th className="p-4">{t("admin.product")}</th>
                <th className="p-4">{t("admin.price")}</th>
                <th className="p-4">{t("admin.stock")}</th>
                <th className="p-4">{t("admin.visibility")}</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const hidden = p.status && p.status !== "active";
                return (
                  <tr key={p.id} className="border-b border-zinc-800 last:border-0 cursor-pointer hover:bg-zinc-800" onClick={() => navigate(`/admin/products/${p.id}`)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white w-12 h-12 rounded flex items-center justify-center shrink-0">
                          {p.image && <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />}
                        </div>
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-gray-500 text-xs">{[p.brands?.name, p.categories?.name].filter(Boolean).join(" · ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{formatUSD(p.price, i18n.language)}</td>
                    <td className={`p-4 ${Number(p.stock) > 3 ? "" : "text-red-400 font-bold"}`}>{p.stock ?? 0}</td>
                    <td className="p-4">
                      {hidden ? (
                        <span className="inline-flex items-center gap-1 text-gray-400"><EyeOff className="w-4 h-4" /> {t("admin.hidden")}</span>
                      ) : (
                        <span className="text-green-400">{t("admin.visible")}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/admin/products/${p.id}`} aria-label={t("common.edit")} className="inline-block p-2 text-white hover:text-cyan-400"><Pencil className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(p)} aria-label={t("common.delete")} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function OrdersAdmin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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

  const list = orders.filter((o) => !filter || o.status === filter);

  return (
    <>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white">
        <option value="">{t("admin.all")}</option>
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.status.${s}`)}</option>)}
      </select>

      {list.length === 0 ? (
        <p className="text-gray-400">{t("admin.noOrders")}</p>
      ) : (
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
              {list.map((o) => (
                <tr key={o.id} className="border-b border-zinc-800 last:border-0 align-top cursor-pointer hover:bg-zinc-800" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td className="p-4 font-bold">{o.id}</td>
                  <td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleString(i18n.language)}</td>
                  <td className="p-4">
                    {(o.order_items || []).map((i) => <div key={i.id}>{i.product_name} × {i.quantity}</div>)}
                    {o.shipping_address && <div className="text-gray-500 text-xs mt-2 max-w-xs">{o.shipping_address}</div>}
                  </td>
                  <td className="p-4">{formatUSD(o.total, i18n.language)}</td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-2 flex flex-wrap gap-2"><StatusBadge status={o.status} />{o.request_status === "pending" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300">↩️ {t("returns.badge")}</span>}{o.country && <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800" title={o.country}>{flag(o.country)} {o.country}</span>}{o.payment_method === "momo" && o.payment_status === "pending" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300">📱 {t("delivery.toVerify")}</span>}{o.payment_method === "cod" && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${o.payment_status === "collected" ? "bg-green-500/20 text-green-300" : "bg-orange-500/20 text-orange-300"}`}>💵 {t("delivery.codShort")}</span>}{o.delivery_status && <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/15 text-cyan-300">🛵 {t(`delivery.steps.${o.delivery_status}`)}</span>}</div>
                    <select value={o.status} onChange={(e) => update(o, { status: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white">
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.status.${s}`)}</option>)}
                    </select>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
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
      )}
    </>
  );
}
