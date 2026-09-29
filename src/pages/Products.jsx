import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import ProductCard from "@/components/ProductCard/ProductCard";
import useProducts from "@/hooks/useProducts";
import { getCategories } from "@/api/categories";

const SORTS = {
  newest: { label: "Newest", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  name: { label: "Name", fn: (a, b) => (a.name || "").localeCompare(b.name || "") },
};

export default function Products() {
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
      .filter((p) =>
        !text
          ? true
          : [p.name, p.description, p.brands?.name, p.categories?.name]
              .filter(Boolean)
              .some((v) => v.toLowerCase().includes(text))
      )
      .filter((p) => !category || p.categories?.name === category)
      .sort(SORTS[sort]?.fn || SORTS.newest.fn);
  }, [products, q, category, sort]);

  return (
    <MainLayout>
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold">All Products</h1>
            <p className="text-gray-400 mt-2">
              {loading ? "Loading..." : `${filtered.length} product(s)`}
              {q && <> for “<span className="text-cyan-400">{q}</span>”</>}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(e) => update("category", e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>

            {(q || category) && (
              <button
                onClick={() => setParams({})}
                className="border border-zinc-700 hover:bg-zinc-800 rounded-lg px-4 py-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="text-gray-400 py-20 text-center">No products found.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
