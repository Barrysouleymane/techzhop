import {
  Smartphone,
  Laptop,
  Headphones,
  Monitor,
  Gamepad2,
  Watch,
} from "lucide-react";

const categories = [
  { name: "Phones", icon: <Smartphone size={40} /> },
  { name: "Laptops", icon: <Laptop size={40} /> },
  { name: "Audio", icon: <Headphones size={40} /> },
  { name: "Monitors", icon: <Monitor size={40} /> },
  { name: "Gaming", icon: <Gamepad2 size={40} /> },
  { name: "Smart Watches", icon: <Watch size={40} /> },
];

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto py-16 px-6">

      <h2 className="text-4xl font-bold mb-10">
        Shop by Category
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

        {categories.map((category) => (
          <div
            key={category.name}
            className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer"
          >
            <div className="text-cyan-600">
              {category.icon}
            </div>

            <p className="mt-4 font-semibold">
              {category.name}
            </p>
          </div>
        ))}

      </div>

    </section>
  );
}