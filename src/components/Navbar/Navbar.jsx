import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import CartIcon from "../Cart/CartIcon";
import UserMenu from "../UserMenu/UserMenu";
import useCart from "@/hooks/useCart";

export default function Navbar() {
  const { cart } = useCart();

  // Total quantity of all cart items
  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center gap-6 px-6 py-4">

        <Logo />

        <SearchBar />

        <UserMenu />

        <CartIcon count={cartCount} />

      </div>
    </header>
  );
}