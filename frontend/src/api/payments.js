import api from "./axios";

// ──────────────────────────────────────────────────────────────
// PAYMENT SERVICE  →  /payments
// Payment gateway is internal (no Stripe). All flows are
// handled via the payments Lambda + DynamoDB.
// ──────────────────────────────────────────────────────────────

/**
 * List payments visible to the current user / business.
 * Response: { payments: Payment[] }
 */
export const getPayments = async () => {
  const response = await api.get("/payments");
  return response.data;
};

/**
 * Create a payment record for an existing order.
 * @param {object} data - { orderId, amount, currency, paymentMethod }
 * Response: { paymentId, orderId, amount, currency, paymentStatus }
 */
export const createPayment = async (data) => {
  const response = await api.post("/payments", data);
  return response.data;
};

/**
 * Create a payment intent for an existing order (internal flow).
 * @param {object} data - { orderId }
 * Response: { paymentId, orderId, amount, currency, paymentStatus, clientSecret }
 */
export const createPaymentIntent = async (data) => {
  const response = await api.post("/payments/intent", data);
  return response.data;
};

/**
 * Verify / authorize a payment.
 * @param {object} data - { orderId, paymentStatus }
 * Response: { orderId, paymentStatus }
 */
export const verifyPayment = async (data) => {
  const response = await api.post("/payments/verify", data);
  return response.data;
};

/**
 * Capture an authorized payment (admin only).
 * @param {object} data - { paymentId }
 */
export const capturePayment = async (data) => {
  const response = await api.post("/payments/capture", data);
  return response.data;
};

/**
 * Refund a captured payment (admin only).
 * @param {object} data - { paymentId, refundAmount }
 */
export const refundPayment = async (data) => {
  const response = await api.post("/payments/refund", data);
  return response.data;
};

/**
 * Cancel a payment (admin only).
 * @param {object} data - { paymentId }
 */
export const cancelPayment = async (data) => {
  const response = await api.post("/payments/cancel", data);
  return response.data;
};

/**
 * Verify purchase order for a business account (B2B internal flow).
 * @param {object} data - { orderId, creditSafetyMargin? }
 */
export const verifyPurchaseOrder = async (data) => {
  const response = await api.post("/payments/po-verify", data);
  return response.data;
};

/**
 * Update payment metadata and status.
 * @param {string} paymentId 
 * @param {object} data - e.g. { paymentStatus: 'PAID' }
 */
export const updatePayment = async (paymentId, data) => {
  const response = await api.put(`/payments/${paymentId}`, data);
  return response.data;
};
