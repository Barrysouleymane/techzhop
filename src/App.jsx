import { Routes, Route } from "react-router-dom";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import ProductDetails from "@/pages/ProductDetails";
import Account from "@/pages/Account";
import Cart from "@/pages/Cart";
import Success from "@/pages/Success";

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/account"
        element={<Account />}
      />

      <Route
        path="/cart"
        element={<Cart />}
      />

      <Route
        path="/checkout"
        element={<Checkout />}
      />

      <Route
        path="/success"
        element={<Success />}
      />

      <Route
        path="/product/:id"
        element={<ProductDetails />}
      />

    </Routes>
  );
}