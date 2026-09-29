import useProducts from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function FeaturedProducts() {
  const { products, loading } = useProducts();

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-white">Loading featured products...</p>
      </section>
    );
  }

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">

      <h2 className="text-4xl font-bold text-white mb-10">
        ⭐ Featured Products
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}

      </div>

    </section>
  );
}