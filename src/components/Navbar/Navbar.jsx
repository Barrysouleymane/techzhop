import { ShoppingCart, Heart, User, Search } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-4">
        <h1 className="text-3xl font-bold text-cyan-400">
          TECHZHOP
        </h1>

        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
          />

          <input
            type="text"
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-black"
          />
        </div>

        <button className="hover:text-cyan-400">
          <Heart />
        </button>

        <button className="hover:text-cyan-400">
          <ShoppingCart />
        </button>

        <button className="hover:text-cyan-400">
          <User />
        </button>
      </div>
    </header>
  );
}