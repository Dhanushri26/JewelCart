import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../frontend/src/api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../../frontend/src/api/axios";
import {
  getCartItems,
  getCartSummary,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  bulkImportCart,
} from "../../../frontend/src/api/cart";

describe("cart API module", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getCartItems calls GET /cart", async () => {
    api.get.mockResolvedValue({ data: { items: [] } });
    await getCartItems();
    expect(api.get).toHaveBeenCalledWith("/cart");
  });

  it("getCartSummary calls GET /cart/summary", async () => {
    api.get.mockResolvedValue({ data: { subtotal: 0 } });
    await getCartSummary();
    expect(api.get).toHaveBeenCalledWith("/cart/summary");
  });

  it("addCartItem calls POST /cart/items with data", async () => {
    const payload = { productId: "p1", quantity: 2 };
    api.post.mockResolvedValue({ data: payload });
    await addCartItem(payload);
    expect(api.post).toHaveBeenCalledWith("/cart/items", payload);
  });

  it("updateCartItem calls PUT /cart/items/:id with data", async () => {
    api.put.mockResolvedValue({ data: {} });
    await updateCartItem("p1", { quantity: 3 });
    expect(api.put).toHaveBeenCalledWith("/cart/items/p1", { quantity: 3 });
  });

  it("deleteCartItem calls DELETE /cart/items/:id", async () => {
    api.delete.mockResolvedValue({ data: {} });
    await deleteCartItem("p1");
    expect(api.delete).toHaveBeenCalledWith("/cart/items/p1");
  });

  it("clearCart calls DELETE /cart/clear", async () => {
    api.delete.mockResolvedValue({ data: {} });
    await clearCart();
    expect(api.delete).toHaveBeenCalledWith("/cart/clear");
  });

  it("bulkImportCart calls POST /cart/bulk-import with items array", async () => {
    const items = [{ productId: "p1", quantity: 1 }];
    api.post.mockResolvedValue({ data: { imported: 1 } });
    await bulkImportCart(items);
    expect(api.post).toHaveBeenCalledWith("/cart/bulk-import", { items });
  });
});
