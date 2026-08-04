import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { getOrders } from "../api/orders";
import { getInventory } from "../api/inventory";
import { getPayments } from "../api/payments";
import { useAppContext } from "../context/AppContext";

const NAV_ITEMS = [
  "Dashboard",
  "Products",
  "Inventory",
  "Orders",
  "Payments",
  "Customers",
  "Analytics",
  "Settings",
];

const NAV_ICONS = {
  Dashboard: LayoutDashboard,
  Products: Boxes,
  Inventory: Boxes,
  Orders: ShoppingBag,
  Payments: CreditCard,
  Customers: Users,
  Analytics: BarChart3,
  Settings: Settings,
};

export function AdminPage() {
  const { user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [ordersData, inventoryData, paymentsData] = await Promise.allSettled([
          getOrders(),
          getInventory(),
          getPayments(),
        ]);

        if (ordersData.status === "fulfilled") {
          setOrders(ordersData.value.orders || []);
        }
        if (inventoryData.status === "fulfilled") {
          setInventory(inventoryData.value.items || []);
        }
        if (paymentsData.status === "fulfilled") {
          setPayments(paymentsData.value.payments || []);
        }
      } catch (err) {
        console.error("[AdminPage] dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // ── Derived stats ──
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const paidPaymentCount = payments.filter((p) => p.paymentStatus === "PAID").length;
  const paymentSuccessRate =
    payments.length > 0
      ? Math.round((paidPaymentCount / payments.length) * 100)
      : 0;

  const stats = [
    {
      label: "Revenue",
      value: loading ? "—" : `₹${(totalRevenue / 100000).toFixed(1)}L`,
      icon: BarChart3,
      sub: "from paid orders",
    },
    {
      label: "Orders",
      value: loading ? "—" : orders.length.toLocaleString("en-IN"),
      icon: ShoppingBag,
      sub: `${orders.filter((o) => o.orderStatus === "PENDING_PAYMENT").length} pending`,
    },
    {
      label: "Inventory",
      value: loading ? "—" : inventory.length.toLocaleString("en-IN"),
      icon: Boxes,
      sub: `${inventory.filter((i) => i.inventoryStatus === "LOW_STOCK").length} low stock`,
    },
    {
      label: "Payments",
      value: loading ? "—" : `${paymentSuccessRate}%`,
      icon: CreditCard,
      sub: "success rate",
    },
  ];

  const recentOrders = orders.slice(0, 5);
  const lowStockItems = inventory
    .filter((i) => Number(i.availableQuantity || 0) <= Number(i.reorderThreshold || 2))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">

        {/* Sidebar */}
        <aside className="w-full rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6 lg:w-72">
          <h1 className="text-2xl font-semibold tracking-[0.3em]">JEWELCART ADMIN</h1>
          {user && (
            <p className="mt-1 text-xs text-stone-500">{user.email} · {user.role}</p>
          )}
          <nav className="mt-8 space-y-2 text-sm text-stone-400">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item];
              return (
                <button
                  key={item}
                  id={`admin-nav-${item.toLowerCase()}`}
                  onClick={() => setActiveNav(item)}
                  className={`flex w-full items-center gap-3 rounded-full px-3 py-2 transition hover:bg-stone-800 hover:text-white ${
                    activeNav === item ? "bg-stone-800 text-white" : ""
                  }`}
                >
                  <Icon size={16} />
                  {item}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {/* Stats row */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  id={`admin-stat-${stat.label.toLowerCase()}`}
                  className="rounded-[1.25rem] border border-stone-800 bg-stone-900 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">{stat.label}</span>
                    <Icon className="text-amber-500" size={18} />
                  </div>
                  {loading ? (
                    <Loader2 className="mt-4 animate-spin text-stone-600" size={20} />
                  ) : (
                    <>
                      <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-xs text-stone-500">{stat.sub}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inventory + Recent Orders */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Inventory */}
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl">Inventory Overview</h2>
              <div className="mt-6 space-y-3 text-sm text-stone-400">
                {loading ? (
                  <Loader2 className="animate-spin text-stone-600" size={20} />
                ) : inventory.length === 0 ? (
                  <p className="text-stone-600">No inventory records found.</p>
                ) : (
                  inventory.slice(0, 6).map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-2xl bg-stone-800 px-4 py-3"
                    >
                      <span className="truncate">{item.productId}</span>
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          Number(item.availableQuantity) <= Number(item.reorderThreshold || 2)
                            ? "bg-rose-900 text-rose-300"
                            : "bg-emerald-900 text-emerald-300"
                        }`}
                      >
                        {item.availableQuantity ?? 0} in stock
                      </span>
                    </div>
                  ))
                )}
                {lowStockItems.length > 0 && !loading && (
                  <p className="text-xs text-rose-400">
                    ⚠ {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} at or below reorder threshold
                  </p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl">Recent Orders</h2>
              <div className="mt-6 space-y-3 text-sm text-stone-400">
                {loading ? (
                  <Loader2 className="animate-spin text-stone-600" size={20} />
                ) : recentOrders.length === 0 ? (
                  <p className="text-stone-600">No orders yet.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="rounded-2xl bg-stone-800 px-4 py-3"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono text-xs text-stone-300">
                          #{order.orderId?.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs">
                          ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {order.orderStatus?.replace(/_/g, " ")} ·{" "}
                        {order.paymentStatus}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
