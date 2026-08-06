import { Boxes, Loader2, ShoppingBag } from "lucide-react";

export default function DashboardPanel({
  loading,
  stats,
  recentOrders,
  lowStockItems,
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-[1.25rem] border border-stone-800 bg-stone-900 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">{stat.label}</span>

                <Icon className="text-amber-500" size={18} />
              </div>

              {loading ? (
                <Loader2
                  className="mt-4 animate-spin text-stone-600"
                  size={20}
                />
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

      {/* Dashboard Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Low Stock */}
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Boxes size={20} className="text-amber-500" />
            <h2 className="text-xl font-medium">Inventory Overview</h2>
          </div>

          <div className="space-y-3 text-sm">
            {loading ? (
              <Loader2 className="animate-spin text-stone-600" size={20} />
            ) : lowStockItems.length === 0 ? (
              <p className="text-stone-500">No low stock items.</p>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-2xl bg-stone-800 px-4 py-3"
                >
                  <span className="truncate">{item.productId}</span>

                  <span className="rounded-full bg-rose-900 px-2.5 py-0.5 text-xs font-medium text-rose-300">
                    {item.availableQuantity} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShoppingBag size={20} className="text-amber-500" />
            <h2 className="text-xl font-medium">Recent Orders</h2>
          </div>

          <div className="space-y-3 text-sm">
            {loading ? (
              <Loader2 className="animate-spin text-stone-600" size={20} />
            ) : recentOrders.length === 0 ? (
              <p className="text-stone-500">No orders yet.</p>
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
                    {order.orderStatus?.replaceAll("_", " ")} •{" "}
                    {order.paymentStatus}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
