import { useEffect, useState } from "react";
import { getProduct } from "@/api/product";

export default function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProduct(id);
        setProduct(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return {
    product,
    loading,
  };
}