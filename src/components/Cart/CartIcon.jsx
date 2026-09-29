import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import useCart from "@/hooks/useCart";

export default function CartIcon() {
  const { cart } = useCart();

  const count = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  return (
    <Link
      to="/cart"
      className="relative flex items-center hover:text-cyan-400 transition"
    >
      <ShoppingCart className="w-6 h-6" />

      {count > 0 && (
        <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  );
}