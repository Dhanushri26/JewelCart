import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AppProvider,
  useAppContext,
} from "../../../frontend/src/context/AppContext";

// Mock the API calls used by the provider.
vi.mock("../../../frontend/src/api/cart", () => ({
  addCartItem: vi.fn(),
  getCartItems: vi.fn(),
  updateCartItem: vi.fn(),
  deleteCartItem: vi.fn(),
  clearCart: vi.fn(),
  bulkImportCart: vi.fn(),
}));

vi.mock("../../../frontend/src/api/orders", () => ({
  getOrders: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

import { fetchAuthSession } from "aws-amplify/auth";
import { getCartItems } from "../../../frontend/src/api/cart";
import { getOrders } from "../../../frontend/src/api/orders";

function TestConsumer() {
  const { user, cart, addToWishlist, wishlist } = useAppContext();

  return (
    <div>
      <div data-testid="user-role">{user?.role || "none"}</div>
      <div data-testid="cart-count">{cart.length}</div>
      <button onClick={() => addToWishlist({ id: 99, name: "Pendant" })}>
        add wishlist
      </button>
      <div data-testid="wishlist-count">{wishlist.length}</div>
    </div>
  );
}

describe("AppContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAuthSession.mockResolvedValue({ tokens: null });
    getCartItems.mockResolvedValue({ data: { items: [{ id: 1 }] } });
    getOrders.mockResolvedValue({ orders: [] });
  });

  it("provides context values to children", async () => {
    // Arrange
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    // Assert
    expect(await screen.findByTestId("cart-count")).toHaveTextContent("1");
    expect(screen.getByTestId("user-role")).toHaveTextContent("none");
  });

  it("updates wishlist state when addToWishlist is called", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: /add wishlist/i }));

    // Assert
    expect(await screen.findByTestId("wishlist-count")).toHaveTextContent("1");
  });
});
