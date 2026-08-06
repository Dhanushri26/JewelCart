import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../frontend/src/api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import api from "../../../frontend/src/api/axios";
import {
  getPayments,
  createPayment,
  createPaymentIntent,
  verifyPayment,
  capturePayment,
  refundPayment,
  cancelPayment,
  verifyPurchaseOrder,
  updatePayment,
} from "../../../frontend/src/api/payments";

describe("payments API module", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getPayments calls GET /payments", async () => {
    api.get.mockResolvedValue({ data: { payments: [] } });
    const result = await getPayments();
    expect(api.get).toHaveBeenCalledWith("/payments");
    expect(result.payments).toEqual([]);
  });

  it("createPayment calls POST /payments with data", async () => {
    const payload = {
      orderId: "o1",
      amount: 100,
      currency: "INR",
      paymentMethod: "CARD",
    };
    api.post.mockResolvedValue({ data: { paymentId: "pay1" } });
    const result = await createPayment(payload);
    expect(api.post).toHaveBeenCalledWith("/payments", payload);
    expect(result.paymentId).toBe("pay1");
  });

  it("createPaymentIntent calls POST /payments/intent", async () => {
    api.post.mockResolvedValue({
      data: { paymentId: "pay1", clientSecret: "secret" },
    });
    const result = await createPaymentIntent({ orderId: "o1" });
    expect(api.post).toHaveBeenCalledWith("/payments/intent", {
      orderId: "o1",
    });
    expect(result.clientSecret).toBe("secret");
  });

  it("verifyPayment calls POST /payments/verify", async () => {
    api.post.mockResolvedValue({
      data: { orderId: "o1", paymentStatus: "PAID" },
    });
    const result = await verifyPayment({
      orderId: "o1",
      paymentStatus: "PAID",
    });
    expect(api.post).toHaveBeenCalledWith("/payments/verify", {
      orderId: "o1",
      paymentStatus: "PAID",
    });
    expect(result.paymentStatus).toBe("PAID");
  });

  it("capturePayment calls POST /payments/capture", async () => {
    api.post.mockResolvedValue({ data: { paymentId: "pay1" } });
    await capturePayment({ paymentId: "pay1" });
    expect(api.post).toHaveBeenCalledWith("/payments/capture", {
      paymentId: "pay1",
    });
  });

  it("refundPayment calls POST /payments/refund", async () => {
    api.post.mockResolvedValue({ data: {} });
    await refundPayment({ paymentId: "pay1", refundAmount: 50 });
    expect(api.post).toHaveBeenCalledWith("/payments/refund", {
      paymentId: "pay1",
      refundAmount: 50,
    });
  });

  it("cancelPayment calls POST /payments/cancel", async () => {
    api.post.mockResolvedValue({ data: {} });
    await cancelPayment({ paymentId: "pay1" });
    expect(api.post).toHaveBeenCalledWith("/payments/cancel", {
      paymentId: "pay1",
    });
  });

  it("verifyPurchaseOrder calls POST /payments/po-verify", async () => {
    api.post.mockResolvedValue({ data: { status: "APPROVED" } });
    const result = await verifyPurchaseOrder({ orderId: "o1" });
    expect(api.post).toHaveBeenCalledWith("/payments/po-verify", {
      orderId: "o1",
    });
    expect(result.status).toBe("APPROVED");
  });

  it("updatePayment calls PUT /payments/:id with data", async () => {
    api.put.mockResolvedValue({ data: { paymentStatus: "PAID" } });
    const result = await updatePayment("pay1", { paymentStatus: "PAID" });
    expect(api.put).toHaveBeenCalledWith("/payments/pay1", {
      paymentStatus: "PAID",
    });
    expect(result.paymentStatus).toBe("PAID");
  });
});
