import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getBrands } from "@/api/brands";

export default function BrandSection() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getBrands().then(setBrands).catch(console.error);
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto py-14 px-6">
      <h2 className="text-3xl sm:text-4xl font-bold mb-8">{t("home.brands")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            to={`/products?q=${encodeURIComponent(b.name)}`}
            className="bg-white rounded-xl h-24 flex items-center justify-center p-4 no-underline hover:ring-2 hover:ring-cyan-500 transition"
          >
            {b.logo ? (
              <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-bold" style={{ color: "#18181b" }}>{b.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
