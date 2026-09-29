import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "" });
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    navigate("/account");
  }

  const field =
    "w-full p-4 rounded-xl bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-cyan-500";

  return (
    <MainLayout>
      <section className="max-w-xl mx-auto px-6 py-16">
        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-8 space-y-5">
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>

          <label className="block">
            <span className="text-gray-400 text-sm">Email</span>
            <input value={email} disabled className={`${field} mt-1 opacity-60`} />
          </label>

          <label className="block">
            <span className="text-gray-400 text-sm">Full name</span>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={`${field} mt-1`}
              required
            />
          </label>

          <label className="block">
            <span className="text-gray-400 text-sm">Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${field} mt-1`}
            />
          </label>

          {message && <p className="text-red-400">{message}</p>}

          <div className="flex gap-4 pt-2">
            <button
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-lg"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/account")}
              className="border border-zinc-700 hover:bg-zinc-800 px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </MainLayout>
  );
}
