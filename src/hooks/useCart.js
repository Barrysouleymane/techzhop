import { useEffect } from "react";
import useCartStore from "@/store/cartStore";

export default function useCart() {
  const items = useCartStore((s) => s.items);
  const loading = useCartStore((s) => s.loading);
  const load = useCartStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return { cart: items, loading, reloadCart: load };
}
