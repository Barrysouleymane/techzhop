import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/layouts/MainLayout";
import { User } from "lucide-react";

export default function Account() {
  const [profile, setProfile] = useState(null);

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="bg-black rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold">0</h2>
              <p>Orders</p>
            </div>

            <div className="bg-black rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold">0</h2>
              <p>Wishlist</p>
            </div>

            <div className="bg-black rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold">0</h2>
              <p>Addresses</p>
            </div>

            <div className="bg-black rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold">0</h2>
              <p>Payments</p>
            </div>

          </div>

          <div className="mt-10 flex gap-4">

            <button
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-lg font-semibold"
            >
              Edit Profile
            </button>

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