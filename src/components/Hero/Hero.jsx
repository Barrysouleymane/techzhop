export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-cyan-700 text-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-6xl font-bold mb-6">
          Welcome to TechZhop
        </h1>

        <p className="text-xl max-w-2xl mb-8">
          Discover laptops, smartphones, TVs, gaming gear,
          accessories and the latest technology at great prices.
        </p>

        <button className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200">
          Shop Now
        </button>
      </div>
    </section>
  );
}