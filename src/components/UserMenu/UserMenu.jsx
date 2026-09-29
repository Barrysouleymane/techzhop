import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Heart, Package, Shield } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useWishlistStore from "@/store/wishlistStore";

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const link = "flex items-center gap-2 text-white hover:text-cyan-400 transition no-underline";

  return (
    <nav className="flex items-center gap-5">
      <Link to="/products" className={link} title={t("nav.products")}>
        <Package className="w-5 h-5" />
        <span className="hidden lg:inline">{t("nav.products")}</span>
      </Link>

      <Link to="/wishlist" className={`${link} relative`} title={t("nav.wishlist")}>
        <Heart className="w-5 h-5" />
        <span className="hidden lg:inline">{t("nav.wishlist")}</span>
        {wishlistCount > 0 && (
          <span className="absolute -top-2 -left-2 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
            {wishlistCount}
          </span>
        )}
      </Link>

      {isAdmin && (
        <Link to="/admin" className={link} title={t("nav.admin")}>
          <Shield className="w-5 h-5" />
          <span className="hidden lg:inline">{t("nav.admin")}</span>
        </Link>
      )}

      <Link to={user ? "/account" : "/login"} className={link} title={user ? t("nav.account") : t("nav.login")}>
        <User className="w-6 h-6" />
        <span className="hidden lg:inline">{user ? t("nav.account") : t("nav.login")}</span>
      </Link>
    </nav>
  );
}
