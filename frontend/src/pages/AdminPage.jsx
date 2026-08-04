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
import { useOutletContext } from "react-router-dom";
import { getOrders } from "../api/orders";
import { getInventory } from "../api/inventory";
import { getPayments } from "../api/payments";
import { useAppContext } from "../context/AppContext";
import DashboardPanel from "../components/admin/DashboardPanel";
import ProductsPanel from "../components/admin/ProductsPanel";
import InventoryPanel from "../components/admin/InventoryPanel";
import OrdersPanel from "../components/admin/OrdersPanel";
import PaymentsPanel from "../components/admin/PaymentsPanel";
import CustomersPanel from "../components/admin/CustomersPanel";
import AnalyticsPanel from "../components/admin/AnalyticsPanel";
import SettingsPanel from "../components/admin/SettingsPanel";
import AdminSidebar from "../components/admin/AdminSidebar";
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
  const { activeNav } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [ordersData, inventoryData, paymentsData] =
          await Promise.allSettled([
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

  const paidPaymentCount = payments.filter(
    (p) => p.paymentStatus === "PAID",
  ).length;
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
    .filter(
      (i) =>
        Number(i.availableQuantity || 0) <= Number(i.reorderThreshold || 2),
    )
    .slice(0, 5);

  return (
    <>
      {activeNav === "Dashboard" && (
        <DashboardPanel
          loading={loading}
          stats={stats}
          recentOrders={recentOrders}
          lowStockItems={lowStockItems}
        />
      )}

      {activeNav === "Products" && <ProductsPanel />}
      {activeNav === "Inventory" && <InventoryPanel />}
      {activeNav === "Orders" && <OrdersPanel />}
      {activeNav === "Payments" && <PaymentsPanel />}
      {activeNav === "Customers" && <CustomersPanel />}
      {activeNav === "Analytics" && <AnalyticsPanel />}
      {activeNav === "Settings" && <SettingsPanel />}
    </>
  );
}
