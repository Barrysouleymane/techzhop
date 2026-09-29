import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import "./i18n";

import App from "./App";
import ThemeSync from "./components/ThemeSync";
import { supabase } from "./lib/supabase";
import useCartStore from "./store/cartStore";

// Reload the cart whenever the user logs in or out
supabase.auth.onAuthStateChange(() => {
  useCartStore.getState().load();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeSync />
      <Toaster position="top-center" richColors closeButton />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
