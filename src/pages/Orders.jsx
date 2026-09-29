import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Package } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/config/constants";

const STATUS_STYLES = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-red-500/15 text-red-400",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return;

        const res = await axios.get(`${API_URL}/orders/${session.user.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <MainLayout>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>

        {loading && <p className="text-gray-400">Loading orders...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-14 h-14 mx-auto mb-4" />
            <p>You haven't placed any orders yet.</p>
            <Link
              to="/products"
              className="inline-block mt-6 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
            >
              Start shopping
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <header className="flex flex-wrap justify-between items-center gap-4 border-b border-zinc-800 pb-4 mb-4">
                <div>
                  <h2 className="font-bold text-lg">Order #{order.id}</h2>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                    STATUS_STYLES[order.status] || "bg-zinc-800 text-gray-300"
                  }`}
                >
                  {order.status}
                </span>
              </header>

              <ul className="space-y-2">
                {(order.order_items || []).map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <Link to={`/product/${item.product_id}`} className="hover:text-cyan-400">
                      {item.product_name} × {item.quantity}
                    </Link>
                    <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <footer className="flex justify-between border-t border-zinc-800 mt-4 pt-4 font-bold">
                <span>Total</span>
                <span className="text-cyan-400">${Number(order.total).toFixed(2)}</span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
