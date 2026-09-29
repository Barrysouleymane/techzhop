import { Routes, Route } from "react-router-dom";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetails from "@/pages/ProductDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Account from "@/pages/Account";
import Profile from "@/pages/Profile";
import Addresses from "@/pages/Addresses";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import Wishlist from "@/pages/Wishlist";
import Settings from "@/pages/Settings";
import Security from "@/pages/Security";
import Help from "@/pages/Help";
import Legal from "@/pages/Legal";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/success" element={<Success />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/help" element={<Help />} />
      <Route path="/terms" element={<Legal type="terms" />} />
      <Route path="/privacy" element={<Legal type="privacy" />} />

      {/* Logged-in users */}
      <Route path="/checkout" element={protect(<Checkout />)} />
      <Route path="/account" element={protect(<Account />)} />
      <Route path="/profile" element={protect(<Profile />)} />
      <Route path="/addresses" element={protect(<Addresses />)} />
      <Route path="/orders" element={protect(<Orders />)} />
      <Route path="/orders/:id" element={protect(<OrderDetails />)} />
      <Route path="/security" element={protect(<Security />)} />

      {/* Admin */}
      <Route path="/admin" element={protect(<Admin />, true)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
