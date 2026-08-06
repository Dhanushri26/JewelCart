import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  addCartItem,
  getCartItems,
  updateCartItem,
  deleteCartItem,
  clearCart as apiClearCart,
} from "../api/cart";
import { getOrders, createOrder as apiCreateOrder } from "../api/orders";

const AppContext = createContext(undefined);

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replaceAll(/-/g, "+").replaceAll(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function resolveRole(payload) {
  const groups = payload["cognito:groups"] || [];
  if (groups.includes("Admin")) return "Admin";
  if (groups.includes("Business")) return "Business";
  return "Customer";
}

// ────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────

export function AppProvider({ children }) {
  // ── Auth / User ──
  const [user, setUser] = useState(null);
  // user = { userId, email, role, name }
  const [authLoading, setAuthLoading] = useState(true);
  // ── Cart ──
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  // ── Wishlist (local state only) ──
  const [wishlist, setWishlist] = useState([]);

  // ── Orders ──
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Notifications ──
  const [toast, setToast] = useState(null); // { message, type }

  // ──────────────────────────────────────────────
  // Load user from Cognito session
  // ──────────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        const session = await fetchAuthSession();
        const idTokenStr = session.tokens?.idToken?.toString();
        if (!idTokenStr) return;
        const payload = decodeJwtPayload(idTokenStr);
        setUser({
          userId: payload.sub || "",
          email: payload.email || "",
          name: payload.name || payload.email?.split("@")[0] || "Guest",
          role: resolveRole(payload),
        });
      } catch {
        // Session unavailable
      } finally {
        setAuthLoading(false);
      }
    }
    loadUser();
  }, []);

  // ──────────────────────────────────────────────
  // Cart operations
  // ──────────────────────────────────────────────

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const response = await getCartItems();
      // Lambda returns: { cartId: string, items: CartItem[] }
      const items = response.data?.items || [];
      setCart(items);
    } catch (err) {
      console.error("[AppContext] loadCart error:", err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  /** Add product to cart then reload from backend. */
  const addToCart = useCallback(
    async (product) => {
      try {
        // Lambda accepts productId (string uuid from product-service)
        const productId = product.productId ?? product.id;
        await addCartItem({ productId, quantity: 1 });
        await loadCart();
        showToast("Added to cart!", "success");
      } catch (err) {
        console.error("[AppContext] addToCart error:", err);
        showToast(
          err.response?.data?.message || "Could not add item to cart.",
          "error",
        );
      }
    },
    [loadCart],
  );

  /** Update cart item quantity on backend then reload. */
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (quantity <= 0) return removeFromCart(productId);
      try {
        await updateCartItem(productId, { quantity });
        await loadCart();
      } catch (err) {
        console.error("[AppContext] updateQuantity error:", err);
        showToast(
          err.response?.data?.message || "Could not update quantity.",
          "error",
        );
      }
    },
    [loadCart],
  );

  /** Remove a cart item from backend then reload. */
  const removeFromCart = useCallback(
    async (productId) => {
      try {
        await deleteCartItem(productId);
        await loadCart();
      } catch (err) {
        console.error("[AppContext] removeFromCart error:", err);
        showToast(
          err.response?.data?.message || "Could not remove item.",
          "error",
        );
      }
    },
    [loadCart],
  );

  /** Clear all cart items. */
  const clearCartItems = useCallback(async () => {
    try {
      await apiClearCart();
      setCart([]);
    } catch (err) {
      console.error("[AppContext] clearCart error:", err);
    }
  }, []);

  // ──────────────────────────────────────────────
  // Order operations
  // ──────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("[AppContext] loadOrders error:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async (notes = "") => {
      const data = await apiCreateOrder({ notes });
      // Clear cart from state after successful order
      setCart([]);
      await loadOrders();
      return data; // { order: { orderId, ... } }
    },
    [loadOrders],
  );

  // ──────────────────────────────────────────────
  // Wishlist (local – no backend yet)
  // ──────────────────────────────────────────────

  const addToWishlist = useCallback((product) => {
    setWishlist((prev) =>
      prev.some(
        (item) =>
          item.id === product.id || item.productId === product.productId,
      )
        ? prev
        : [...prev, product],
    );
  }, []);

  const removeFromWishlist = useCallback((id) => {
    setWishlist((prev) =>
      prev.filter((item) => item.id !== id && item.productId !== id),
    );
  }, []);

  // ──────────────────────────────────────────────
  // Toast helper
  // ──────────────────────────────────────────────
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ──────────────────────────────────────────────
  // Context value (memoized for performance)
  // ──────────────────────────────────────────────
  const value = useMemo(
    () => ({
      // auth
      user,
      authLoading,
      // cart
      cart,
      cartLoading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCartItems,
      loadCart,
      // orders
      orders,
      ordersLoading,
      loadOrders,
      createOrder,
      // wishlist
      wishlist,
      addToWishlist,
      removeFromWishlist,
      // ui
      toast,
      showToast,
    }),
    [
      user,
      cart,
      cartLoading,
      orders,
      ordersLoading,
      wishlist,
      toast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCartItems,
      loadCart,
      loadOrders,
      createOrder,
      addToWishlist,
      removeFromWishlist,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
}
