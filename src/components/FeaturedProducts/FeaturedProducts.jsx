import { useTranslation } from "react-i18next";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function FeaturedProducts({ products = [], loading }) {
  const { t } = useTranslation();
  if (loading || products.length === 0) return null;

  const featured = products.filter((p) => p.featured || p.is_featured);
  const list = (featured.length ? featured : products).slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <h2 className="text-3xl sm:text-4xl font-bold mb-8">⭐ {t("home.featured")}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
