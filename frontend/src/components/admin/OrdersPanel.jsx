import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { getOrders } from "../../api/orders";

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadOrders() {
    setLoading(true);

    try {
      const data = await getOrders();
      console.log("Orders data:", data);
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      (order.orderId || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>

        <p className="text-stone-400">Manage customer orders.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-3.5 text-stone-500" />

        <input
          placeholder="Search Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-white outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
        <table className="w-full">
          <thead className="bg-stone-800">
            <tr className="text-left text-sm text-stone-300">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Order Status</th>
              <th className="px-6 py-4">Payment</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-stone-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-t border-stone-800 hover:bg-stone-800/40"
                >
                  <td className="px-6 py-4 font-mono text-sm">
                    {order.orderId
                      ? `#${order.orderId.substring(0, 8).toUpperCase()}`
                      : "Missing info"}
                  </td>

                  <td className="px-6 py-4">
                    {order.userId
                      ? `#${order.userId.substring(0, 8).toUpperCase()}`
                      : "Missing info"}
                  </td>

                  <td className="px-6 py-4">
                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-900 px-3 py-1 text-xs text-blue-300">
                      {order.orderStatus?.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs
                      ${
                        order.paymentStatus === "PAID"
                          ? "bg-green-900 text-green-300"
                          : order.paymentStatus === "PENDING"
                            ? "bg-yellow-900 text-yellow-300"
                            : order.paymentStatus === "FAILED"
                              ? "bg-red-900 text-red-300"
                              : order.paymentStatus === "REFUNDED"
                                ? "bg-purple-900 text-purple-300"
                                : "bg-stone-900 text-stone-300"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
