import { Link, NavLink, Outlet } from "react-router-dom";
import { Heart, ShoppingBag, Search, UserRound, Menu } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const navItems = [
  "Home",
  "Jewelry",
  "Collections",
  "Gemstones",
  "New Arrivals",
  "Offers",
  "About",
  "Contact",
];

export function MainLayout() {
  const { cart, wishlist } = useAppContext();

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fcf8f1_0%,#f7eee3_100%)] text-stone-800">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link
            to="/"
            className="text-2xl font-semibold tracking-[0.35em] text-stone-700"
          >
            JEWELCART
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-stone-600 lg:flex">
            {navItems.map((item) => {
              const to =
                item === "Home"
                  ? "/"
                  : `/${item.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <NavLink
                  key={item}
                  to={to}
                  className={({ isActive }) =>
                    isActive ? "text-amber-700" : "hover:text-amber-700"
                  }
                >
                  {item}
                </NavLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {/* <button className="rounded-full border border-stone-200 p-2.5 text-stone-600"><Search size={18} /></button> */}
            <Link
              to="/wishlist"
              className="relative rounded-full border border-stone-200 p-2.5 text-stone-600"
            >
              <Heart size={18} />
              {wishlist.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative rounded-full border border-stone-200 p-2.5 text-stone-600"
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="rounded-full border border-stone-200 p-2.5 text-stone-600"
            >
              <UserRound size={18} />
            </Link>
            <button className="rounded-full border border-stone-200 p-2.5 lg:hidden">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-stone-900 px-4 py-12 text-stone-300 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <p className="text-xl font-semibold tracking-[0.3em] text-white">
              JEWELCART
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-400">
              Curated heirloom pieces designed to celebrate life’s most
              meaningful moments.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>New Arrivals</li>
              <li>Bridal</li>
              <li>Watches</li>
              <li>Gemstones</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white">Customer Care</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>Book a Consultation</li>
              <li>Free Shipping</li>
              <li>Easy Returns</li>
              <li>Lifetime Service</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white">Visit</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>24, Rosewood Avenue</li>
              <li>Luxury District</li>
              <li>hello@jewelcart.com</li>
              <li>+91 99999 12345</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
