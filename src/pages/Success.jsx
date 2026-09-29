import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import MainLayout from "@/layouts/MainLayout";

export default function Success() {
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) {
        setError("Payment session not found.");
        setLoading(false);
        return;
      }

      try {
        console.log("SESSION ID:", sessionId);

        const response = await axios.get(
          `http://localhost:8000/checkout-session/${sessionId}`
        );

        console.log("SESSION DATA:", response.data);

        setSession(response.data);
      } catch (err) {
        console.error("LOAD SESSION ERROR:", err);

        setError(
          err.response?.data?.error ||
            err.message ||
            "Unable to load payment information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <MainLayout>
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-6">⏳</div>

          <h1 className="text-3xl font-bold">
            Loading payment...
          </h1>

          <p className="text-gray-400 mt-3">
            Please wait while we confirm your payment.
          </p>
        </section>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">

          <div className="text-6xl mb-6">
            ⚠️
          </div>

          <h1 className="text-3xl font-bold mb-4">
            Payment completed
          </h1>

          <p className="text-red-400 mb-8">
            {error}
          </p>

          <Link
            to="/"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
          >
            Continue Shopping
          </Link>

        </section>
      </MainLayout>
    );
  }

  const amount =
    session?.amount_total != null
      ? (session.amount_total / 100).toFixed(2)
      : "0.00";

  const customerEmail =
    session?.customer_details?.email || "Not provided";

  return (
    <MainLayout>
      <section className="max-w-4xl mx-auto px-6 py-20">

        <div className="text-center">

          <div className="text-7xl mb-8">
            ✅
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-400 text-lg">
            Thank you for your purchase from TechZhop.
          </p>

        </div>

        {/* PAYMENT INFORMATION */}

        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">

          <h2 className="text-2xl font-bold mb-6">
            Payment Details
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span className="text-gray-400">
                Payment status
              </span>

              <span className="text-green-400 font-bold">
                {session?.payment_status || "paid"}
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span className="text-gray-400">
                Total
              </span>

              <span className="text-cyan-400 font-bold text-xl">
                ${amount}
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span className="text-gray-400">
                Email
              </span>

              <span>
                {customerEmail}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Order ID
              </span>

              <span className="text-sm break-all max-w-md text-right">
                {session?.id}
              </span>
            </div>

          </div>

        </div>

        {/* BUTTONS */}

        <div className="flex justify-center gap-4 mt-10">

          <Link
            to="/"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
          >
            Continue Shopping
          </Link>

          <Link
            to="/account"
            className="border border-zinc-700 hover:bg-zinc-800 px-6 py-3 rounded-lg"
          >
            My Account
          </Link>

        </div>

      </section>
    </MainLayout>
  );
}