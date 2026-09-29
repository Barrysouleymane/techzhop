import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function ProductGrid({ products = [], loading }) {
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex items-end justify-between mb-8 gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold m-0">{t("home.latest")}</h2>
        <Link to="/products" className="text-cyan-400 no-underline">{t("common.seeAll")} →</Link>
      </div>

      {loading ? (
        <p className="text-gray-400">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
