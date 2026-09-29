import { useParams } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import useProduct from "@/hooks/useProduct";

export default function ProductDetails() {
  const { id } = useParams();

  const { product, loading } = useProduct(id);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          Loading...
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          Product not found.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="max-w-7xl mx-auto px-8 py-16">

        <div className="grid lg:grid-cols-2 gap-16">

          {/* Image */}

          <img
            src={product.image}
            alt={product.name}
            className="rounded-xl w-full bg-zinc-900"
          />

          {/* Product Info */}

          <div>

            <h1 className="text-5xl font-bold">
              {product.name}
            </h1>

            <p className="text-cyan-400 text-4xl mt-6">
              ${product.price}
            </p>

            <div className="mt-6 space-y-3">

              <p>
                <strong>Brand:</strong>{" "}
                {product.brands?.name}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {product.categories?.name}
              </p>

              <p>
                <strong>SKU:</strong>{" "}
                {product.sku}
              </p>

              <p>
                <strong>Stock:</strong>{" "}
                {product.stock}
              </p>

            </div>

            <button
              className="mt-10 w-full bg-cyan-500 hover:bg-cyan-600 py-4 rounded-lg text-xl font-bold"
            >
              Add to Cart
            </button>

          </div>

        </div>

        {/* Description */}

        <div className="mt-20">

          <h2 className="text-3xl font-bold mb-6">
            Description
          </h2>

          <p className="text-gray-300 leading-8">
            {product.description}
          </p>

        </div>

      </section>
    </MainLayout>
  );
}