import { useState } from "react";
import axios from "axios";
import MainLayout from "@/layouts/MainLayout";
import useProducts from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/config/constants";

const EMPTY = { name: "", description: "", price: "", stock: "", image: "", sku: "" };

export default function Admin() {
  const { products, loading } = useProducts();
  const [created, setCreated] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const all = [...created, ...products];
  const totalStock = all.reduce((t, p) => t + Number(p.stock || 0), 0);
  const outOfStock = all.filter((p) => !p.stock || p.stock <= 0).length;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const res = await axios.post(`${API_URL}/products`, form, {
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      setCreated((c) => [res.data.data, ...c]);
      setForm(EMPTY);
      setMessage("✅ Product added");
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full p-3 rounded-lg bg-zinc-800 outline-none focus:ring-2 focus:ring-cyan-500";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <MainLayout>
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            ["Products", all.length],
            ["Units in stock", totalStock],
            ["Out of stock", outOfStock],
          ].map(([label, value]) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-gray-400">{label}</p>
              <p className="text-3xl font-bold mt-2">{loading ? "…" : value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 space-y-4 h-fit">
            <h2 className="text-2xl font-bold">Add product</h2>
            <input placeholder="Name *" required value={form.name} onChange={set("name")} className={field} />
            <textarea placeholder="Description" rows={3} value={form.description} onChange={set("description")} className={field} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" min="0" placeholder="Price *" required value={form.price} onChange={set("price")} className={field} />
              <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={set("stock")} className={field} />
            </div>
            <input type="url" placeholder="Image URL" value={form.image} onChange={set("image")} className={field} />
            <input placeholder="SKU" value={form.sku} onChange={set("sku")} className={field} />
            {message && <p className="text-sm">{message}</p>}
            <button disabled={saving} className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold py-3 rounded-lg">
              {saving ? "Saving..." : "Add product"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-zinc-900 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-zinc-800">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800 last:border-0">
                    <td className="p-4 flex items-center gap-3">
                      <div className="bg-white w-10 h-10 rounded flex items-center justify-center shrink-0">
                        {p.image && <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />}
                      </div>
                      {p.name}
                    </td>
                    <td className="p-4">${Number(p.price).toFixed(2)}</td>
                    <td className={`p-4 ${p.stock > 0 ? "" : "text-red-400"}`}>{p.stock ?? 0}</td>
                    <td className="p-4 capitalize">{p.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
