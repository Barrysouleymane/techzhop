import { Link } from "react-router-dom";
import { User, Heart, Package, Shield } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useWishlistStore from "@/store/wishlistStore";

export default function UserMenu() {
  const { user, isAdmin } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const link = "flex items-center gap-2 hover:text-cyan-400 transition";

  return (
    <nav className="flex items-center gap-5">
      <Link to="/products" className={link}>
        <Package className="w-5 h-5" />
        <span className="hidden lg:inline">Products</span>
      </Link>

      <Link to="/wishlist" className={`${link} relative`}>
        <Heart className="w-5 h-5" />
        <span className="hidden lg:inline">Wishlist</span>
        {wishlistCount > 0 && (
          <span className="absolute -top-2 -left-2 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
            {wishlistCount}
          </span>
        )}
      </Link>

      {isAdmin && (
        <Link to="/admin" className={link}>
          <Shield className="w-5 h-5" />
          <span className="hidden lg:inline">Admin</span>
        </Link>
      )}

      <Link to={user ? "/account" : "/login"} className={link}>
        <User className="w-6 h-6" />
        <span className="hidden lg:inline">{user ? "Account" : "Login"}</span>
      </Link>
    </nav>
  );
}
