import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-24 grid md:grid-cols-2 gap-10 items-center">

        <div>

          <span className="bg-cyan-500 text-black px-4 py-2 rounded-full font-bold">
            Summer Sale 2026
          </span>

          <h1 className="text-6xl font-extrabold mt-8 leading-tight">
            Discover the Latest
            <br />
            Electronics
          </h1>

          <p className="text-gray-300 mt-6 text-xl">
            Shop smartphones, gaming laptops, TVs, accessories and thousands
            of premium tech products.
          </p>

          <div className="flex gap-5 mt-10">

            <Button size="lg">
              Shop Now
            </Button>

            <Button variant="outline" size="lg">
              Browse Categories
            </Button>

          </div>

        </div>

        <div className="flex justify-center">

          <img
            src="/hero.png"
            alt="TechZhop Hero"
            className="rounded-3xl shadow-2xl"
          />

        </div>

      </div>
    </section>
  );
}