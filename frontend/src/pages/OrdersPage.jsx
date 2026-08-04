import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, RefreshCw, ShoppingBag } from "lucide-react";
import { useAppContext } from "../context/AppContext";

/** Map Lambda orderStatus values to friendly display labels and colors. */
function statusBadge(status) {
  const map = {
    PENDING_PAYMENT: {
      label: "Pending Payment",
      color: "bg-amber-100 text-amber-700",
    },
    PENDING_MANAGEMENT_APPROVAL: {
      label: "Awaiting Approval",
      color: "bg-blue-100 text-blue-700",
    },
    CONFIRMED: { label: "Confirmed", color: "bg-sky-100 text-sky-700" },
    PROCESSING: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
    SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelled", color: "bg-rose-100 text-rose-700" },
  };
  return (
    map[status] || {
      label: status || "Unknown",
      color: "bg-stone-100 text-stone-600",
    }
  );
}

function paymentBadge(status) {
  const map = {
    PENDING: { label: "Payment Pending", color: "bg-amber-100 text-amber-700" },
    PAID: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
    FAILED: { label: "Payment Failed", color: "bg-rose-100 text-rose-700" },
    REFUNDED: { label: "Refunded", color: "bg-blue-100 text-blue-700" },
  };
  return (
    map[status] || {
      label: status || "Unknown",
      color: "bg-stone-100 text-stone-600",
    }
  );
}

export function OrdersPage() {
  const { orders, ordersLoading, loadOrders } = useAppContext();

  // Ensure orders are loaded when this page mounts
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
              Order History
            </p>
            <h1 className="mt-2 text-3xl text-stone-800">
              Track every precious delivery.
            </h1>
          </div>
          <button
            onClick={loadOrders}
            disabled={ordersLoading}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            id="orders-refresh-btn"
          >
            <RefreshCw
              size={14}
              className={ordersLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {ordersLoading && orders.length === 0 && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-[1.25rem] border border-stone-200 p-6"
              >
                <div className="h-4 w-32 rounded-full bg-stone-200" />
                <div className="mt-3 h-5 w-48 rounded-full bg-stone-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-stone-100" />
                  <div className="h-6 w-20 rounded-full bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order list */}
        {!ordersLoading || orders.length > 0 ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const oStatus = statusBadge(order.orderStatus);
              const pStatus = paymentBadge(order.paymentStatus);
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const itemCount = Array.isArray(order.items)
                ? order.items.length
                : "—";

              return (
                <div
                  key={order.orderId}
                  className="rounded-[1.25rem] border border-stone-200 p-6 transition hover:border-amber-200 hover:shadow-sm"
                  id={`order-${order.orderId}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Order ID + Date */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-700">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-500">
                          #{order.orderId?.substring(0, 8).toUpperCase()}
                        </p>
                        <h2 className="mt-0.5 text-lg text-stone-800">
                          {dateStr}
                        </h2>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span
                        className={`rounded-full px-3 py-1 ${pStatus.color}`}
                      >
                        {pStatus.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${oStatus.color}`}
                      >
                        {oStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4 text-sm text-stone-600">
                    <span>
                      {itemCount} {itemCount === 1 ? "item" : "items"} ,{" "}
                      {order.items?.map((item) => item.title).join(", ")}
                    </span>

                    <span className="font-semibold text-stone-900">
                      Total ₹
                      {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {orders.length === 0 && !ordersLoading && (
              <div className="rounded-[1.25rem] border border-dashed border-stone-300 p-16 text-center">
                <ShoppingBag className="mx-auto text-stone-300" size={40} />
                <p className="mt-4 text-stone-500">No orders placed yet.</p>
                <Link
                  to="/jewelry"
                  className="mt-4 inline-block rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white"
                >
                  Browse Collection
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
