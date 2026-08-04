import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  MapPin,
  Heart,
  ShoppingBag,
  Settings,
  LogOut,
  Package,
} from "lucide-react";
import { signOut } from "aws-amplify/auth";
import { useAppContext } from "../context/AppContext";

export function ProfilePage() {
  const { user, orders, ordersLoading, loadOrders, wishlist, cart } =
    useAppContext();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload(); // App.jsx will re-check session and show login
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const roleBadgeColor = {
    Admin: "bg-rose-100 text-rose-700",
    Business: "bg-blue-100 text-blue-700",
    Customer: "bg-emerald-100 text-emerald-700",
  }[user?.role] ?? "bg-stone-100 text-stone-600";

  const stats = [
    {
      icon: Package,
      title: "Orders",
      text: ordersLoading
        ? "Loading…"
        : `${orders.length} order${orders.length !== 1 ? "s" : ""}`,
      link: "/orders",
    },
    {
      icon: Heart,
      title: "Wishlist",
      text: `${wishlist.length} hearted piece${wishlist.length !== 1 ? "s" : ""}`,
      link: "/wishlist",
    },
    {
      icon: ShoppingBag,
      title: "Cart",
      text: `${cart.length} item${cart.length !== 1 ? "s" : ""} in cart`,
      link: "/cart",
    },
    {
      icon: Settings,
      title: "Preferences",
      text: "Personalized alerts & settings",
      link: "#",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
              Client Profile
            </p>
            <h1 className="mt-2 text-3xl text-stone-800">
              Welcome back, {user?.name || "Guest"}.
            </h1>
            {user?.email && (
              <p className="mt-1 text-sm text-stone-500">{user.email}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
              <UserRound className="text-stone-600" />
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeColor}`}>
                {user?.role || "Customer"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              id="sign-out-btn"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 hover:bg-rose-100"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                to={item.link}
                key={item.title}
                id={`profile-${item.title.toLowerCase()}-card`}
                className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-sm"
              >
                <div className="inline-flex rounded-full bg-amber-100 p-2 text-amber-700">
                  <Icon size={18} />
                </div>
                <h2 className="mt-4 text-lg text-stone-800">{item.title}</h2>
                <p className="mt-2 text-sm text-stone-600">{item.text}</p>
              </Link>
            );
          })}
        </div>

        {/* Recent orders preview */}
        {orders.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl text-stone-800">Recent Orders</h2>
            <div className="mt-4 space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between rounded-[1rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm"
                >
                  <span className="font-medium text-stone-700">
                    #{order.orderId?.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-stone-500">
                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                    {order.orderStatus?.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/orders"
              className="mt-4 inline-block text-sm font-semibold text-stone-700 hover:text-amber-700"
            >
              View all orders →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
