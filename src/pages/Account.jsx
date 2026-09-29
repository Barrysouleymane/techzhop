import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User, MapPin, Package, Heart, Bell, Globe, Coins, SunMoon, KeyRound, Trash2,
  LifeBuoy, FileText, ShieldCheck, LogOut, ChevronRight, Shield,
} from "lucide-react";
import Page, { card } from "@/components/Page";
import useAuth from "@/hooks/useAuth";
import useWishlistStore from "@/store/wishlistStore";
import { supabase } from "@/lib/supabase";
import { getProfile, getMyOrders, getAddresses } from "@/api/account";

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [profile, setProfile] = useState(null);
  const [ordersCount, setOrdersCount] = useState(null);
  const [addressCount, setAddressCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(setProfile).catch(console.error);
    getMyOrders().then((o) => setOrdersCount(o.length)).catch(() => {});
    getAddresses(user.id).then((a) => setAddressCount(a.length)).catch(() => {});
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const sections = [
    {
      title: t("account.myAccount"),
      items: [
        { to: "/profile", icon: User, label: t("account.profile") },
        { to: "/addresses", icon: MapPin, label: t("account.addresses"), count: addressCount },
        { to: "/orders", icon: Package, label: t("account.orders"), count: ordersCount },
        { to: "/wishlist", icon: Heart, label: t("account.wishlist"), count: wishlistCount },
      ],
    },
    {
      title: t("account.preferences"),
      items: [
        { to: "/settings#notifications", icon: Bell, label: t("account.notifications") },
        { to: "/settings#language", icon: Globe, label: t("account.language") },
        { to: "/settings#currency", icon: Coins, label: t("account.currency") },
        { to: "/settings#theme", icon: SunMoon, label: t("account.theme") },
      ],
    },
    {
      title: t("account.security"),
      items: [
        { to: "/security", icon: KeyRound, label: t("account.changePassword") },
        { to: "/security#delete", icon: Trash2, label: t("account.deleteAccount"), danger: true },
      ],
    },
    {
      title: t("account.support"),
      items: [
        { to: "/help", icon: LifeBuoy, label: t("account.help") },
        { to: "/terms", icon: FileText, label: t("account.terms") },
        { to: "/privacy", icon: ShieldCheck, label: t("account.privacy") },
      ],
    },
  ];

  if (isAdmin) {
    sections[0].items.push({ to: "/admin", icon: Shield, label: t("account.adminPanel") });
  }

  return (
    <Page width="max-w-4xl">
      <div className={`${card} p-6 sm:p-8 flex items-center gap-6 mb-8`}>
        <Link to="/profile" className="shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-500 flex items-center justify-center text-black">
              <User size={40} />
            </div>
          )}
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile?.full_name || user?.user_metadata?.full_name || t("account.title")}</h1>
          <p className="text-gray-400 mb-0 truncate">{user?.email}</p>
          <p className="text-gray-500 mb-0">{profile?.phone || t("account.noPhone")}</p>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">{section.title}</h2>
            <div className={`${card} divide-y divide-zinc-800 overflow-hidden`}>
              {section.items.map(({ to, icon: Icon, label, count, danger }) => (
                <Link key={to} to={to} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800 transition no-underline">
                  <Icon className={`w-5 h-5 ${danger ? "text-red-400" : "text-cyan-400"}`} />
                  <span className={`flex-1 ${danger ? "text-red-400" : "text-white"}`}>{label}</span>
                  {count != null && count > 0 && (
                    <span className="bg-zinc-800 text-gray-300 text-sm rounded-full px-3 py-0.5">{count}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl">
          <LogOut className="w-5 h-5" /> {t("auth.logout")}
        </button>
      </div>
    </Page>
  );
}
