import Logo from "../Logo/Logo";
import SearchBar from "../SearchBar/SearchBar";
import CartIcon from "../Cart/CartIcon";
import UserMenu from "../UserMenu/UserMenu";
import PromoBar from "../Shop/PromoBar";
import DeliverTo, { DeliverToMobile } from "../DeliverTo/DeliverTo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-zinc-800">
      <PromoBar />
      <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 px-4 sm:px-6 py-3 md:py-4">
        <Logo />
        <DeliverTo />
        <div className="order-3 md:order-none w-full md:w-auto md:flex-1">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-5">
          <UserMenu />
          <CartIcon />
        </div>
      </div>
      <DeliverToMobile />
    </header>
  );
}
