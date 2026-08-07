import api from "./axios";

// ──────────────────────────────────────────────────────────────
// ORDER SERVICE  →  /orders
// ──────────────────────────────────────────────────────────────

/**
 * List all orders for the authenticated user / business.
 * Response: { orders: Order[] }
 */
export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data; // { orders: [...] }
};

/**
 * Fetch a specific order by ID.
 * Response: Order
 */
export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Create a new order from the current active cart.
 * The Lambda reads the cart partition key from the authenticated user's headers.
 * @param {object} data - Optional: { notes?: string, orderId?: string, approvalRequired?: boolean }
 * Response: { order: Order }
 */
export const createOrder = async (data = {}) => {
  const response = await api.post("/orders", data, {
    headers: {
      // Idempotency key to prevent duplicate order creation on retry
      "Idempotency-Key": `order-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    },
  });
  return response.data; // { order: { orderId, totalAmount, orderStatus, ... } }
};

/**
 * Cancel an order (must be in PENDING_PAYMENT or PENDING_MANAGEMENT_APPROVAL state).
 * Response: { message: string }
 */
export const cancelOrder = async (orderId) => {
  const response = await api.put(`/orders/${orderId}/cancel`);
  return response.data;
};

/**
 * Update order metadata (notes, orderStatus – admin only).
 */
export const updateOrder = async (orderId, data) => {
  const response = await api.put(`/orders/${orderId}`, data);
  return response.data;
};
