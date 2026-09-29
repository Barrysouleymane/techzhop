import { Routes, Route, Link } from "react-router-dom";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetails from "@/pages/ProductDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import Wishlist from "@/pages/Wishlist";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import Admin from "@/pages/Admin";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

function NotFound() {
  return (
    <MainLayout>
      <section className="text-center py-24">
        <h1 className="text-6xl font-bold text-cyan-400">404</h1>
        <p className="text-gray-400 mt-4">This page doesn't exist.</p>
        <Link to="/" className="inline-block mt-8 bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg">
          Back to home
        </Link>
      </section>
    </MainLayout>
  );
}

const protect = (el, adminOnly = false) => (
  <ProtectedRoute adminOnly={adminOnly}>{el}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/success" element={<Success />} />

      {/* Logged-in users */}
      <Route path="/checkout" element={protect(<Checkout />)} />
      <Route path="/account" element={protect(<Account />)} />
      <Route path="/profile" element={protect(<Profile />)} />
      <Route path="/orders" element={protect(<Orders />)} />

      {/* Admin */}
      <Route path="/admin" element={protect(<Admin />, true)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
