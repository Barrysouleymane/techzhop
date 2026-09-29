import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Page from "@/components/Page";
import ProductCard from "@/components/ProductCard/ProductCard";
import useProducts from "@/hooks/useProducts";
import { getCategories } from "@/api/categories";

const SORTS = {
  newest: () => 0,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => (a.name || "").localeCompare(b.name || ""),
};
const SORT_LABEL = {
  newest: "products.sortNewest",
  "price-asc": "products.sortPriceAsc",
  "price-desc": "products.sortPriceDesc",
  name: "products.sortName",
};

export default function Products() {
  const { t } = useTranslation();
  const { products, loading } = useProducts();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    return products
      .filter(
        (p) =>
          !text ||
          [p.name, p.description, p.brands?.name, p.categories?.name]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(text))
      )
      .filter((p) => !category || p.categories?.name === category)
      .sort(SORTS[sort] || SORTS.newest);
  }, [products, q, category, sort]);

  const select = "bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white";

  return (
    <Page width="max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold">{t("products.title")}</h1>
          <p className="text-gray-400 mt-2 mb-0">
            {loading ? t("common.loading") : t("products.count", { count: filtered.length })}{" "}
            {q && <span className="text-cyan-400">{t("products.for", { q })}</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={category} onChange={(e) => update("category", e.target.value)} className={select}>
            <option value="">{t("products.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => update("sort", e.target.value)} className={select}>
            {Object.keys(SORTS).map((key) => (
              <option key={key} value={key}>{t(SORT_LABEL[key])}</option>
            ))}
          </select>

          {(q || category) && (
            <button onClick={() => setParams({})} className="border border-zinc-700 hover:bg-zinc-800 rounded-lg px-4 py-2 text-white">
              {t("common.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="text-gray-400 py-20 text-center">{t("products.noResults")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Page>
  );
}
