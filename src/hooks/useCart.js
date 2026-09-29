import { useEffect, useState } from "react";
import { fetchCart } from "@/services/cartService";

export default function useCart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadCart() {
    try {
      const data = await fetchCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  return {
    cart,
    loading,
    reloadCart: loadCart,
  };
}