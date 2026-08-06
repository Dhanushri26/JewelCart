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
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  updateOrder,
} from "../../../frontend/src/api/orders";

describe("orders API module", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getOrders calls GET /orders", async () => {
    api.get.mockResolvedValue({ data: { orders: [] } });
    const result = await getOrders();
    expect(api.get).toHaveBeenCalledWith("/orders");
    expect(result.orders).toEqual([]);
  });

  it("getOrderById calls GET /orders/:id", async () => {
    api.get.mockResolvedValue({ data: { orderId: "o1" } });
    const result = await getOrderById("o1");
    expect(api.get).toHaveBeenCalledWith("/orders/o1");
    expect(result.orderId).toBe("o1");
  });

  it("createOrder calls POST /orders with idempotency header", async () => {
    api.post.mockResolvedValue({ data: { order: { orderId: "o1" } } });
    const result = await createOrder({ notes: "test" });
    expect(api.post).toHaveBeenCalledWith(
      "/orders",
      { notes: "test" },
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": expect.any(String),
        }),
      }),
    );
    expect(result.order.orderId).toBe("o1");
  });

  it("createOrder uses empty object as default payload", async () => {
    api.post.mockResolvedValue({ data: { order: { orderId: "o2" } } });
    await createOrder();
    expect(api.post).toHaveBeenCalledWith("/orders", {}, expect.any(Object));
  });

  it("cancelOrder calls PUT /orders/:id/cancel", async () => {
    api.put.mockResolvedValue({ data: { message: "Cancelled" } });
    const result = await cancelOrder("o1");
    expect(api.put).toHaveBeenCalledWith("/orders/o1/cancel");
    expect(result.message).toBe("Cancelled");
  });

  it("updateOrder calls PUT /orders/:id with data", async () => {
    api.put.mockResolvedValue({
      data: { orderId: "o1", orderStatus: "CONFIRMED" },
    });
    const result = await updateOrder("o1", { orderStatus: "CONFIRMED" });
    expect(api.put).toHaveBeenCalledWith("/orders/o1", {
      orderStatus: "CONFIRMED",
    });
    expect(result.orderStatus).toBe("CONFIRMED");
  });
});
