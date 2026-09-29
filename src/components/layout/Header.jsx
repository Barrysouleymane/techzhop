import { Link } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
} from "lucide-react";

export default function Header() {
  return (
    <header className="bg-[#131921] text-white shadow-md sticky top-0 z-50">

      <div className="max-w-7xl mx-auto flex items-center gap-5 p-4">

        {/* Logo */}

        <Link
          to="/"
          className="text-3xl font-bold text-cyan-400"
        >
          TECHZHOP
        </Link>

        {/* Search */}

        <div className="flex flex-1">

          <select className="bg-gray-200 text-black px-3 rounded-l-md">

            <option>All</option>

            <option>Phones</option>

            <option>Laptops</option>

            <option>Gaming</option>

            <option>Accessories</option>

          </select>

          <input
            className="flex-1 px-4 py-2 text-black outline-none"
            placeholder="Search products..."
          />

          <button className="bg-yellow-400 px-5 rounded-r-md hover:bg-yellow-500">

            <Search className="text-black" />

          </button>

        </div>

        {/* Menu */}

        <div className="flex gap-6">

          <Link to="/login">
            <User />
          </Link>

          <Link to="/wishlist">
            <Heart />
          </Link>

          <Link to="/cart">
            <ShoppingCart />
          </Link>

        </div>

      </div>

    </header>
  );
}