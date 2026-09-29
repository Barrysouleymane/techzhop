import MainLayout from "@/layouts/MainLayout";
import Hero from "@/components/Hero/Hero";
import Categories from "@/components/Categories/Categories";
import FlashDeals from "@/components/FlashDeals/FlashDeals";
import FeaturedProducts from "@/components/FeaturedProducts/FeaturedProducts";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import BrandSection from "@/components/BrandSection/BrandSection";
import Newsletter from "@/components/Newsletter/Newsletter";
import useProducts from "@/hooks/useProducts";

export default function Home() {
  const { products, loading } = useProducts();

  return (
    <MainLayout>
      <Hero />
      <Categories />
      <FeaturedProducts products={products} loading={loading} />
      <FlashDeals products={products} loading={loading} />
      <ProductGrid products={products} loading={loading} />
      <BrandSection />
      <Newsletter />
    </MainLayout>
  );
}
