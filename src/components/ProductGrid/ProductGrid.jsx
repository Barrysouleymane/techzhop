import useProducts from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function ProductGrid() {
  const { products, loading } = useProducts();

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-white">Loading products...</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">

      <h2 className="text-4xl font-bold text-white mb-10">
        Latest Products
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}

      </div>

    </section>
  );
}