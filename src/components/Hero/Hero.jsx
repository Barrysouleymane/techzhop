import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="bg-cyan-500 text-black px-4 py-2 rounded-full font-bold text-sm">
            {t("home.heroBadge")}
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold mt-8 leading-tight text-white" style={{ color: "#fff" }}>
            {t("home.heroTitle")}
          </h1>

          <p className="mt-6 text-lg sm:text-xl" style={{ color: "#d4d4d8" }}>{t("home.heroText")}</p>

          <div className="flex flex-wrap gap-4 mt-10">
            <Link to="/products" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg no-underline">
              {t("home.shopNow")}
            </Link>
            <a href="#categories" className="border border-white/40 hover:bg-white/10 font-semibold px-6 py-3 rounded-lg no-underline" style={{ color: "#fff" }}>
              {t("home.browseCategories")}
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          <img src="/hero.png" alt="TechZhop" className="rounded-3xl shadow-2xl max-h-[420px] object-cover" />
        </div>
      </div>
    </section>
  );
}
