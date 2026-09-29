import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import "./i18n";

import App from "./App";
import ThemeSync from "./components/ThemeSync";
import ErrorBoundary from "./components/ErrorBoundary";
import { supabase } from "./lib/supabase";
import axios from "axios";
import i18n from "./i18n";
import { API_URL } from "./config/constants";
import useCartStore from "./store/cartStore";
import useShopStore from "./store/shopStore";

// Reload the cart whenever the user logs in or out
useShopStore.getState().load();

supabase.auth.onAuthStateChange((event, session) => {
  useCartStore.getState().load();

  // Welcome email (sent once by the server, the first time the user is logged in)
  if (event === "SIGNED_IN" && session) {
    axios
      .post(`${API_URL}/me/welcome`, { language: i18n.language }, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .catch(() => {});
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <ThemeSync />
      <Toaster position="top-center" richColors closeButton />
      <App />
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
