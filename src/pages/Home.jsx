import MainLayout from "@/layouts/MainLayout";

import Hero from "@/components/Hero/Hero";
import Categories from "@/components/Categories/Categories";
import FlashDeals from "@/components/FlashDeals/FlashDeals";
import FeaturedProducts from "@/components/FeaturedProducts/FeaturedProducts";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import BrandSection from "@/components/BrandSection/BrandSection";
import Newsletter from "@/components/Newsletter/Newsletter";

export default function Home() {
  return (
    <MainLayout>
      <Hero />

      <Categories />

      <FlashDeals />

      <FeaturedProducts />

      <ProductGrid />

      <BrandSection />

      <Newsletter />
    </MainLayout>
  );
}