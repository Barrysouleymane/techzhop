import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelect from "@/components/LanguageSelect";

export default function Footer() {
  const { t } = useTranslation();
  const link = "block text-gray-400 hover:text-cyan-400 no-underline py-1";

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo.png" alt="TechZhop" className="w-24 h-24 rounded-full" />
          <p className="mt-2">{t("footer.tagline")}</p>
          <LanguageSelect className="mt-4" />
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-base">{t("footer.shop")}</h3>
          <Link to="/products" className={link}>{t("nav.products")}</Link>
          <Link to="/wishlist" className={link}>{t("nav.wishlist")}</Link>
          <Link to="/cart" className={link}>{t("nav.cart")}</Link>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-base">{t("footer.support")}</h3>
          <Link to="/help" className={link}>{t("account.help")}</Link>
          <Link to="/orders" className={link}>{t("account.orders")}</Link>
          <Link to="/settings" className={link}>{t("settings.title")}</Link>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3 text-base">{t("footer.legal")}</h3>
          <Link to="/terms" className={link}>{t("account.terms")}</Link>
          <Link to="/privacy" className={link}>{t("account.privacy")}</Link>
        </div>
      </div>

      <p className="text-center text-sm pb-8 m-0">
        © {new Date().getFullYear()} TechZhop. {t("footer.rights")}
      </p>
    </footer>
  );
}
