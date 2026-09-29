const products = [
  {
    name: "iPhone 16 Pro",
    price: "$999",
  },
  {
    name: "MacBook Air M4",
    price: "$1299",
  },
  {
    name: "PlayStation 5",
    price: "$499",
  },
  {
    name: "Samsung Galaxy S25",
    price: "$899",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="max-w-7xl mx-auto py-16 px-6">

      <h2 className="text-4xl font-bold mb-8">
        Featured Products
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

        {products.map((product) => (

          <div
            key={product.name}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
          >

            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">

              <span className="text-gray-500">
                Product Image
              </span>

            </div>

            <h3 className="mt-5 font-bold text-xl">
              {product.name}
            </h3>

            <p className="text-cyan-600 text-lg mt-2">
              {product.price}
            </p>

            <button className="mt-5 w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700">
              Add to Cart
            </button>

          </div>

        ))}

      </div>

    </section>
  );
}