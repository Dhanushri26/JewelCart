import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../frontend/src/api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../../frontend/src/api/axios";
import {
  getInventory,
  getInventoryByProduct,
  createInventory,
  reserveInventory,
  updateInventory,
} from "../../../frontend/src/api/inventory";

describe("inventory API module", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getInventory calls GET /inventory", async () => {
    api.get.mockResolvedValue({ data: { totalProducts: 0, items: [] } });
    const result = await getInventory();
    expect(api.get).toHaveBeenCalledWith("/inventory");
    expect(result.items).toEqual([]);
  });

  it("getInventoryByProduct calls GET /inventory/:id", async () => {
    api.get.mockResolvedValue({
      data: { productId: "p1", availableQuantity: 5 },
    });
    const result = await getInventoryByProduct("p1");
    expect(api.get).toHaveBeenCalledWith("/inventory/p1");
    expect(result.productId).toBe("p1");
  });

  it("createInventory calls POST /inventory with data", async () => {
    const payload = { productId: "p1", availableQuantity: 10 };
    api.post.mockResolvedValue({ data: payload });
    const result = await createInventory(payload);
    expect(api.post).toHaveBeenCalledWith("/inventory", payload);
    expect(result.productId).toBe("p1");
  });

  it("reserveInventory calls PATCH /inventory/reserve with data", async () => {
    const payload = { productId: "p1", requestedQuantity: 2 };
    api.patch.mockResolvedValue({ data: { reservationStatus: "RESERVED" } });
    const result = await reserveInventory(payload);
    expect(api.patch).toHaveBeenCalledWith("/inventory/reserve", payload);
    expect(result.reservationStatus).toBe("RESERVED");
  });

  it("updateInventory calls PUT /inventory/:id with data", async () => {
    api.put.mockResolvedValue({ data: { availableQuantity: 20 } });
    const result = await updateInventory("p1", { availableQuantity: 20 });
    expect(api.put).toHaveBeenCalledWith("/inventory/p1", {
      availableQuantity: 20,
    });
    expect(result.availableQuantity).toBe(20);
  });
});
