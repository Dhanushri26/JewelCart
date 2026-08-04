import api from "./axios";

// ──────────────────────────────────────────────────────────────
// INVENTORY SERVICE  →  /inventory
// ──────────────────────────────────────────────────────────────

/**
 * List all inventory records.
 * Response: { totalProducts: number, items: InventoryItem[] }
 */
export const getInventory = async () => {
  const response = await api.get("/inventory");
  return response.data;
};

/**
 * Get stock details for a specific product.
 * Response: { productId, availableQuantity, reservedQuantity, inventoryStatus }
 */
export const getInventoryByProduct = async (productId) => {
  const response = await api.get(`/inventory/${productId}`);
  return response.data;
};

/**
 * Create an inventory record for a product (admin only).
 * @param {object} data - { productId, availableQuantity, reservedQuantity, damagedQuantity, reorderThreshold, inventoryStatus }
 */
export const createInventory = async (data) => {
    const response = await api.post("/inventory", data);
    return response.data;
};
/**
 * Reserve stock for a product (admin/business only).
 * @param {object} data - { productId, requestedQuantity }
 * Response: { productId, availableQuantity, reservedQuantity, reservationStatus }
 */
export const reserveInventory = async (data) => {
  const response = await api.patch("/inventory/reserve", data);
  return response.data;
};

export const updateInventory = async (productId, data) => {
  const response = await api.put(
    `/inventory/${productId}`,
    data
  );

  return response.data;
};
