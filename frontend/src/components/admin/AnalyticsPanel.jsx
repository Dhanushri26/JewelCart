import { useEffect, useMemo, useState } from "react";

import {
  DollarSign,
  ShoppingBag,
  CreditCard,
  Boxes,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { getOrders } from "../../api/orders";
import { getPayments } from "../../api/payments";
import { getProducts } from "../../api/products";
import { getInventory } from "../../api/inventory";

export default function AnalyticsPanel() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    setLoading(true);

    try {
      const [ordersData, paymentsData, productsData, inventoryData] =
        await Promise.all([
          getOrders(),
          getPayments(),
          getProducts(),
          getInventory(),
        ]);

      setOrders(ordersData.orders || []);
      setPayments(paymentsData.payments || []);
      setProducts(productsData.items || []);
      setInventory(inventoryData.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const revenue = useMemo(() => {
    return payments
      .filter((p) => p.paymentStatus === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const paidPayments = payments.filter(
    (p) => p.paymentStatus === "PAID",
  ).length;

  const lowStock = inventory.filter(
    (i) => i.inventoryStatus === "LOW_STOCK",
  ).length;

  const outOfStock = inventory.filter(
    (i) => i.inventoryStatus === "OUT_OF_STOCK",
  ).length;

  const revenueChart = useMemo(() => {
    const months = {};

    payments
      .filter((p) => p.paymentStatus === "PAID")
      .forEach((payment) => {
        const month = new Date(payment.createdAt).toLocaleString("default", {
          month: "short",
        });

        months[month] = (months[month] || 0) + Number(payment.amount || 0);
      });

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [payments]);

  const paymentChart = [
    {
      name: "Paid",
      value: payments.filter((p) => p.paymentStatus === "PAID").length,
    },

    {
      name: "Pending",
      value: payments.filter((p) => p.paymentStatus === "PENDING").length,
    },

    {
      name: "Failed",
      value: payments.filter((p) => p.paymentStatus === "FAILED").length,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="text-stone-400">
          Business insights and performance overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          icon={<DollarSign size={22} />}
        />

        <AnalyticsCard
          title="Orders"
          value={orders.length}
          icon={<ShoppingBag size={22} />}
        />

        <AnalyticsCard
          title="Products"
          value={products.length}
          icon={<Boxes size={22} />}
        />

        <AnalyticsCard
          title="Payments"
          value={paidPayments}
          icon={<CreditCard size={22} />}
        />
      </div>

      {/* Charts */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue Chart */}

        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">Revenue</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status */}

        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">Payments</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentChart}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                <Cell fill="#22c55e" />

                <Cell fill="#eab308" />

                <Cell fill="#ef4444" />
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Summary */}

      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsCard
          title="Low Stock"
          value={lowStock}
          icon={<AlertTriangle size={22} />}
        />

        <AnalyticsCard
          title="Out Of Stock"
          value={outOfStock}
          icon={<AlertTriangle size={22} />}
        />
      </div>
    </div>
  );

  function AnalyticsCard({ title, value, icon }) {
    return (
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
        <div className="flex items-center justify-between text-stone-400">
          <span>{title}</span>
          {icon}
        </div>

        <h2 className="mt-4 text-3xl font-semibold">{value}</h2>
      </div>
    );
  }
}
