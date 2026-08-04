import api from "./axios";

// ──────────────────────────────────────────────────────────────
// CART SERVICE  →  GET  /cart
// Lambda path: GET /cart  (NOT /cart/items)
// ──────────────────────────────────────────────────────────────

/** Fetch the authenticated user's full cart. */
export const getCartItems = () => api.get("/cart");

/** Get cart totals (itemCount, subtotal, tax, grandTotal). */
export const getCartSummary = () => api.get("/cart/summary");

/** Add a product to the cart (or increase quantity if already present). */
export const addCartItem = (data) => api.post("/cart/items", data);
//  data: { productId: string, quantity: number }

/** Update the quantity of an existing cart item. */
export const updateCartItem = (productId, data) =>
  api.put(`/cart/items/${productId}`, data);
//  data: { quantity: number }

/** Remove a single item from the cart (soft-delete). */
export const deleteCartItem = (productId) =>
  api.delete(`/cart/items/${productId}`);

/** Clear all items from the cart. */
export const clearCart = () => api.delete("/cart/clear");

/** B2B bulk-import multiple cart items at once. */
export const bulkImportCart = (items) =>
  api.post("/cart/bulk-import", { items });
//  items: Array<{ productId: string, quantity: number }>
