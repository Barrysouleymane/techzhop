import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCategories } from "@/api/categories";

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="max-w-7xl mx-auto py-14 px-6">
      <h2 className="text-3xl sm:text-4xl font-bold mb-8">{t("home.categories")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/products?category=${encodeURIComponent(c.name)}`}
            className="bg-zinc-900 border border-zinc-800 hover:border-cyan-500 rounded-xl p-6 text-center font-semibold text-white no-underline transition"
          >
            {c.image && <img src={c.image} alt="" className="h-12 mx-auto mb-3 object-contain" />}
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
