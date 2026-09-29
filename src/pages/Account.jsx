import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/layouts/MainLayout";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import useWishlistStore from "@/store/wishlistStore";

export default function Account() {
  const [profile, setProfile] = useState(null);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20 text-center">
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-16">

        <div className="bg-zinc-900 rounded-xl p-10 shadow-lg">

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center">

              <User size={45} />

            </div>

            <div>

              <h1 className="text-3xl font-bold">
                {profile.full_name}
              </h1>

              <p className="text-gray-400 mt-2">
                {profile.email}
              </p>

              <p className="text-gray-500">
                {profile.phone || "No phone number"}
              </p>

            </div>

          </div>

          <hr className="my-10 border-zinc-700" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <Link to="/orders" className="bg-black rounded-lg p-6 text-center hover:ring-2 hover:ring-cyan-500 transition">
              <h2 className="text-xl font-bold">My Orders</h2>
              <p className="text-gray-400 text-sm mt-1">Track your purchases</p>
            </Link>

            <Link to="/wishlist" className="bg-black rounded-lg p-6 text-center hover:ring-2 hover:ring-cyan-500 transition">
              <h2 className="text-3xl font-bold">{wishlistCount}</h2>
              <p>Wishlist</p>
            </Link>

            <Link to="/cart" className="bg-black rounded-lg p-6 text-center hover:ring-2 hover:ring-cyan-500 transition">
              <h2 className="text-xl font-bold">My Cart</h2>
              <p className="text-gray-400 text-sm mt-1">Ready to checkout</p>
            </Link>

          </div>

          <div className="mt-10 flex gap-4">

            <Link
              to="/profile"
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-semibold"
            >
              Edit Profile
            </Link>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            >
              Logout
            </button>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}