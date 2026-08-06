import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock AWS SDK ──────────────────────────────────────────────────────────────
const mockSend = vi.fn();

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  GetCommand: vi.fn((i) => ({ name: "GetCommand", input: i })),
  PutCommand: vi.fn((i) => ({ name: "PutCommand", input: i })),
  UpdateCommand: vi.fn((i) => ({ name: "UpdateCommand", input: i })),
  QueryCommand: vi.fn((i) => ({ name: "QueryCommand", input: i })),
}));

// ── Environment ───────────────────────────────────────────────────────────────
process.env.AWS_REGION = "ap-southeast-1";
process.env.CART_TABLE = "cart-table";
process.env.PRODUCT_TABLE = "product-table";
process.env.INVENTORY_TABLE = "inventory-table";
process.env.DYNAMODB_TABLE_NAME = "main-table";

import { handler } from "../../../backend/cart-service/cart.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const authedEvent = (overrides = {}) => ({
  httpMethod: overrides.method ?? "GET",
  rawPath: overrides.path ?? "/cart",
  headers: {
    "x-user-id": "user-123",
    "x-user-role": "Customer",
    ...overrides.headers,
  },
  body: overrides.body ? JSON.stringify(overrides.body) : null,
  pathParameters: overrides.pathParameters ?? {},
});

describe("cart Lambda handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── OPTIONS ─────────────────────────────────────────────────────────────────
  it("returns 204 for OPTIONS preflight", async () => {
    const res = await handler({ httpMethod: "OPTIONS", headers: {} });
    expect(res.statusCode).toBe(204);
  });

  // ── Auth guard ───────────────────────────────────────────────────────────────
  it("returns 401 when no user id in headers", async () => {
    const res = await handler({
      httpMethod: "GET",
      rawPath: "/cart",
      headers: {},
    });
    expect(res.statusCode).toBe(401);
  });

  // ── GET /cart ────────────────────────────────────────────────────────────────
  it("GET /cart returns cart items for authenticated user", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ productId: "p1", quantity: 1 }],
    });
    const res = await handler(authedEvent({ method: "GET", path: "/cart" }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items).toHaveLength(1);
  });

  // ── GET /cart/summary ────────────────────────────────────────────────────────
  it("GET /cart/summary returns totals", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ quantity: 2, subtotal: 200 }],
    });
    const res = await handler(
      authedEvent({ method: "GET", path: "/cart/summary" }),
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.itemCount).toBe(2);
    expect(body.subtotal).toBe(200);
  });

  // ── POST /cart/items ─────────────────────────────────────────────────────────
  it("POST /cart/items returns 422 for missing productId", async () => {
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/items",
        body: { quantity: 1 },
      }),
    );
    expect(res.statusCode).toBe(422);
  });

  it("POST /cart/items returns 404 when product not found", async () => {
    // fetchProductDetails → null, fetchInventory is irrelevant
    mockSend.mockResolvedValueOnce({ Item: null }); // product lookup
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/items",
        body: { productId: "p99", quantity: 1 },
      }),
    );
    expect(res.statusCode).toBe(404);
  });

  it("POST /cart/items returns 409 when stock is insufficient", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { title: "Ring", price: 100 } }) // product
      .mockResolvedValueOnce({ Item: { availableQuantity: 0 } }) // inventory
      .mockResolvedValueOnce({ Item: null }); // existing cart item
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/items",
        body: { productId: "p1", quantity: 5 },
      }),
    );
    expect(res.statusCode).toBe(409);
  });

  it("POST /cart/items creates cart item successfully", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { title: "Ring", price: 100 } }) // product
      .mockResolvedValueOnce({ Item: { availableQuantity: 10 } }) // inventory
      .mockResolvedValueOnce({ Item: null }) // existing cart item
      .mockResolvedValueOnce({}); // PutCommand
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/items",
        body: { productId: "p1", quantity: 2 },
      }),
    );
    expect(res.statusCode).toBe(201);
  });

  // ── PUT /cart/items/:id ──────────────────────────────────────────────────────
  it("PUT /cart/items/:id returns 422 for zero quantity", async () => {
    const res = await handler({
      httpMethod: "PUT",
      rawPath: "/cart/items/p1",
      headers: { "x-user-id": "user-123", "x-user-role": "Customer" },
      body: JSON.stringify({ quantity: 0 }),
    });
    expect(res.statusCode).toBe(422);
  });

  it("PUT /cart/items/:id returns 404 when item not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: null });
    const res = await handler({
      httpMethod: "PUT",
      rawPath: "/cart/items/p1",
      headers: { "x-user-id": "user-123", "x-user-role": "Customer" },
      body: JSON.stringify({ quantity: 2 }),
    });
    expect(res.statusCode).toBe(404);
  });

  // ── DELETE /cart/items/:id ───────────────────────────────────────────────────
  it("DELETE /cart/items/:id returns 404 when item not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: null });
    const res = await handler({
      httpMethod: "DELETE",
      rawPath: "/cart/items/p1",
      headers: { "x-user-id": "user-123", "x-user-role": "Customer" },
      body: null,
    });
    expect(res.statusCode).toBe(404);
  });

  it("DELETE /cart/items/:id soft-deletes successfully", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { ownerId: "user-123", SK: "ITEM#p1" } })
      .mockResolvedValueOnce({});
    const res = await handler({
      httpMethod: "DELETE",
      rawPath: "/cart/items/p1",
      headers: { "x-user-id": "user-123", "x-user-role": "Customer" },
      body: null,
    });
    expect(res.statusCode).toBe(200);
  });

  // ── DELETE /cart/clear ───────────────────────────────────────────────────────
  it("DELETE /cart/clear clears all items", async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [{ SK: "ITEM#p1" }, { SK: "ITEM#p2" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const res = await handler(
      authedEvent({ method: "DELETE", path: "/cart/clear" }),
    );
    expect(res.statusCode).toBe(200);
  });

  // ── POST /cart/bulk-import ───────────────────────────────────────────────────
  it("POST /cart/bulk-import returns 403 for Customer role", async () => {
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/bulk-import",
        body: { items: [{ productId: "p1", quantity: 1 }] },
      }),
    );
    expect(res.statusCode).toBe(403);
  });

  it("POST /cart/bulk-import returns 422 for empty items array", async () => {
    const res = await handler(
      authedEvent({
        method: "POST",
        path: "/cart/bulk-import",
        headers: {
          "x-user-id": "biz-1",
          "x-user-role": "Business",
          "x-business-id": "biz-1",
        },
        body: { items: [] },
      }),
    );
    expect(res.statusCode).toBe(422);
  });

  // ── Unknown route ────────────────────────────────────────────────────────────
  it("returns 404 for unrecognised route", async () => {
    const res = await handler(
      authedEvent({ method: "GET", path: "/cart/nonexistent/route" }),
    );
    expect(res.statusCode).toBe(404);
  });

  // ── Unexpected error ─────────────────────────────────────────────────────────
  it("returns 500 on unexpected AWS error", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB down"));
    const res = await handler(authedEvent({ method: "GET", path: "/cart" }));
    expect(res.statusCode).toBe(500);
  });
});
