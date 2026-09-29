import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import Page from "@/components/Page";
import ProductCard from "@/components/ProductCard/ProductCard";
import useProducts from "@/hooks/useProducts";
import useShopStore from "@/store/shopStore";
import { getCategories } from "@/api/categories";
import { effectivePrice, isOnSale, discountPercent } from "../../shared/settings";

const SORT_LABEL = {
  newest: "products.sortNewest",
  "price-asc": "products.sortPriceAsc",
  "price-desc": "products.sortPriceDesc",
  rating: "products.sortRating",
  discount: "products.sortDiscount",
  name: "products.sortName",
};

export default function Products() {
  const { t } = useTranslation();
  const { products, loading } = useProducts();
  const ratings = useShopStore((s) => s.ratings);
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const min = params.get("min") || "";
  const max = params.get("max") || "";
  const stars = Number(params.get("stars") || 0);
  const sale = params.get("sale") === "1";
  const sort = params.get("sort") || "newest";

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const brands = useMemo(() => [...new Set(products.map((p) => p.brands?.name).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    const rate = (p) => ratings[p.id]?.avg || 0;
    const sorts = {
      newest: () => 0,
      "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
      "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
      rating: (a, b) => rate(b) - rate(a),
      discount: (a, b) => discountPercent(b) - discountPercent(a),
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
    };
    return products
      .filter((p) => !text || [p.name, p.description, p.brands?.name, p.categories?.name].filter(Boolean).some((v) => v.toLowerCase().includes(text)))
      .filter((p) => !category || p.categories?.name === category)
      .filter((p) => !brand || p.brands?.name === brand)
      .filter((p) => !min || effectivePrice(p) >= Number(min))
      .filter((p) => !max || effectivePrice(p) <= Number(max))
      .filter((p) => !stars || rate(p) >= stars)
      .filter((p) => !sale || isOnSale(p))
      .sort(sorts[sort] || sorts.newest);
  }, [products, ratings, q, category, brand, min, max, stars, sale, sort]);

  const field = "bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white w-full";
  const activeFilters = [category, brand, min, max, stars, sale].filter(Boolean).length;

  const filtersPanel = (
    <div className="space-y-4">
      <select value={category} onChange={(e) => update("category", e.target.value)} className={field}>
        <option value="">{t("products.allCategories")}</option>
        {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <select value={brand} onChange={(e) => update("brand", e.target.value)} className={field}>
        <option value="">{t("products.allBrands")}</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="0" value={min} onChange={(e) => update("min", e.target.value)} placeholder={t("products.priceMin")} className={field} />
        <input type="number" min="0" value={max} onChange={(e) => update("max", e.target.value)} placeholder={t("products.priceMax")} className={field} />
      </div>
      <select value={stars} onChange={(e) => update("stars", e.target.value === "0" ? "" : e.target.value)} className={field}>
        <option value="0">{t("products.anyRating")}</option>
        {[4, 3, 2].map((n) => <option key={n} value={n}>{t("products.starsUp", { count: n })}</option>)}
      </select>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="w-4 h-4 accent-cyan-500" checked={sale} onChange={(e) => update("sale", e.target.checked ? "1" : "")} />
        {t("products.onSaleOnly")}
      </label>
      {(activeFilters > 0 || q) && (
        <button onClick={() => setParams({})} className="w-full border border-zinc-700 hover:bg-zinc-800 rounded-lg px-4 py-2 text-white">
          {t("common.clearFilters")}
        </button>
      )}
    </div>
  );

  return (
    <Page width="max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">{t("products.title")}</h1>
          <p className="text-gray-400 mt-2 mb-0">
            {loading ? t("common.loading") : t("products.count", { count: filtered.length })}{" "}
            {q && <span className="text-cyan-400">{t("products.for", { q })}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden inline-flex items-center gap-2 border border-zinc-700 rounded-lg px-4 py-2 text-white">
            <SlidersHorizontal className="w-4 h-4" /> {t("products.filters")} {activeFilters > 0 && `(${activeFilters})`}
          </button>
          <select value={sort} onChange={(e) => update("sort", e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white">
            {Object.keys(SORT_LABEL).map((key) => <option key={key} value={key}>{t(SORT_LABEL[key])}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <h2 className="text-lg font-bold mb-4 hidden lg:block">{t("products.filters")}</h2>
          {filtersPanel}
        </aside>
        <div className="lg:col-span-3">
          {!loading && filtered.length === 0 ? (
            <p className="text-gray-400 py-20 text-center">{t("products.noResults")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
