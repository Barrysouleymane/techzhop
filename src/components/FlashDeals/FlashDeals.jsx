import { useTranslation } from "react-i18next";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function FlashDeals({ products = [], loading }) {
  const { t } = useTranslation();
  if (loading) return null;

  const deals = products
    .filter((p) => Number(p.stock) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 4);

  if (deals.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <h2 className="text-3xl sm:text-4xl font-bold text-red-500 mb-2">🔥 {t("home.deals")}</h2>
      <p className="text-gray-400 mb-8">{t("home.dealsText")}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
