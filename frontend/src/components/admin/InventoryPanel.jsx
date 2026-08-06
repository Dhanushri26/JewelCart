import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  Search,
  AlertTriangle,
  CircleCheck,
  TriangleAlert,
  CircleX,
} from "lucide-react";
import { getInventory, updateInventory } from "../../api/inventory";
import { getProducts } from "../../api/products";

export default function InventoryPanel() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    availableQuantity: 0,
    reservedQuantity: 0,
    damagedQuantity: 0,
    reorderThreshold: 5,
  });

  async function loadInventory() {
    setLoading(true);

    try {
      const [inventoryResponse, productsResponse] = await Promise.all([
        getInventory(),
        getProducts(),
      ]);

      const inventory = inventoryResponse.items || [];
      const products = productsResponse.items || [];

      const productMap = {};

      products.forEach((product) => {
        productMap[product.id] = product;
      });

      const merged = inventory.map((item) => ({
        ...item,
        product: productMap[item.productId],
      }));

      setInventory(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveInventory() {
    try {
      await updateInventory(editingItem.productId, form);

      await loadInventory();

      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update inventory");
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      (item.productId || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [inventory, search]);

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory</h1>

          <p className="text-stone-400">Manage stock levels.</p>
        </div>
      </div>

      {/* Search */}

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-3.5 text-stone-500" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Product ID..."
          className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-white outline-none"
        />
      </div>
      {inventory.some((i) => i.inventoryStatus === "LOW_STOCK") && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-800 bg-yellow-900/20 p-4 text-yellow-300">
          <AlertTriangle size={18} />
          Some inventory items are below the reorder threshold.
        </div>
      )}

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
        <table className="w-full">
          <thead className="bg-stone-800">
            <tr className="text-left text-sm text-stone-300">
              <th className="px-6 py-4">Product</th>

              <th className="px-6 py-4">Image</th>

              <th className="px-6 py-4">Available</th>

              <th className="px-6 py-4">Reserved</th>

              <th className="px-6 py-4">Damaged</th>

              <th className="px-6 py-4">Threshold</th>

              <th className="px-6 py-4">Status</th>

              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-stone-500">
                  No inventory found.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr
                  key={item.inventoryId}
                  className="border-t border-stone-800 hover:bg-stone-800/40"
                >
                  <td className="px-6 py-4 font-mono text-sm">
                    {item.product.title ? item.product.title : "N/A"}
                  </td>

                  <td className="px-6 py-4">
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </td>

                  <td className="px-6 py-4">{item.availableQuantity}</td>

                  <td className="px-6 py-4">{item.reservedQuantity}</td>

                  <td className="px-6 py-4">{item.damagedQuantity}</td>

                  <td className="px-6 py-4">{item.reorderThreshold}</td>
                  <td className="px-6 py-4">
                    <div title="In Stock">
                      {item.inventoryStatus === "IN_STOCK" && (
                        <CircleCheck className="text-green-500" size={20} />
                      )}
                    </div>
                    <div title="Low Stock">
                      {item.inventoryStatus === "LOW_STOCK" && (
                        <TriangleAlert className="text-yellow-500" size={20} />
                      )}
                    </div>
                    <div title="Out of Stock">
                      {item.inventoryStatus === "OUT_OF_STOCK" && (
                        <CircleX className="text-red-500" size={20} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="rounded-lg p-2 hover:bg-stone-700"
                      onClick={() => {
                        setEditingItem(item);

                        setForm({
                          availableQuantity: item.availableQuantity,
                          reservedQuantity: item.reservedQuantity,
                          damagedQuantity: item.damagedQuantity,
                          reorderThreshold: item.reorderThreshold,
                        });
                      }}
                    >
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Warning */}

      {editingItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="w-[420px] rounded-2xl bg-stone-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Update Inventory</h2>

            <div className="space-y-4">
              <input
                type="number"
                value={form.availableQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availableQuantity: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg bg-stone-800 p-3"
                placeholder="Available"
              />

              <input
                type="number"
                value={form.reservedQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reservedQuantity: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg bg-stone-800 p-3"
                placeholder="Reserved"
              />

              <input
                type="number"
                value={form.damagedQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    damagedQuantity: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg bg-stone-800 p-3"
                placeholder="Damaged"
              />

              <input
                type="number"
                value={form.reorderThreshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reorderThreshold: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg bg-stone-800 p-3"
                placeholder="Threshold"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg bg-stone-700 px-5 py-2"
              >
                Cancel
              </button>

              <button
                onClick={saveInventory}
                className="rounded-lg bg-amber-500 px-5 py-2 text-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
