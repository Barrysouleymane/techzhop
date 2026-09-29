import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import MainLayout from "@/layouts/MainLayout";
import BannerCarousel from "@/components/Shop/BannerCarousel";
import Categories from "@/components/Categories/Categories";
import FlashDeals from "@/components/FlashDeals/FlashDeals";
import FeaturedProducts from "@/components/FeaturedProducts/FeaturedProducts";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import BrandSection from "@/components/BrandSection/BrandSection";
import Newsletter from "@/components/Newsletter/Newsletter";
import ProductRow from "@/components/Shop/ProductRow";
import useProducts from "@/hooks/useProducts";
import useAuth from "@/hooks/useAuth";
import useRecentStore from "@/store/recentStore";
import { getMyOrders } from "@/api/account";

export default function Home() {
  const { t } = useTranslation();
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const recentIds = useRecentStore((s) => s.ids);
  const [boughtIds, setBoughtIds] = useState([]);

  useEffect(() => {
    if (!user) return setBoughtIds([]);
    getMyOrders()
      .then((orders) => setBoughtIds([...new Set(orders.flatMap((o) => (o.order_items || []).map((i) => i.product_id)).filter(Boolean))]))
      .catch(() => {});
  }, [user]);

  const byIds = (ids) => ids.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4);

  return (
    <MainLayout>
      <BannerCarousel />
      <Categories />
      <ProductRow title={t("home.buyAgain")} products={byIds(boughtIds)} />
      <FlashDeals products={products} loading={loading} />
      <FeaturedProducts products={products} loading={loading} />
      <ProductRow title={t("home.recentlyViewed")} products={byIds(recentIds)} />
      <ProductGrid products={products} loading={loading} />
      <BrandSection />
      <Newsletter />
    </MainLayout>
  );
}
