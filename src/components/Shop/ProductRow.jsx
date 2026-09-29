import ProductCard from "@/components/ProductCard/ProductCard";

/** Titled grid of products (hidden when empty) */
export default function ProductRow({ title, products, subtitle, titleClass = "" }) {
  if (!products?.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className={`text-3xl sm:text-4xl font-bold mb-2 ${titleClass}`}>{title}</h2>
      {subtitle && <p className="text-gray-400 mb-6">{subtitle}</p>}
      <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${subtitle ? "" : "mt-6"}`}>
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
