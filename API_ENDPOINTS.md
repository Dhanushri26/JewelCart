# JewelCart — API Endpoint Connection Log

> Auto-generated documentation of all frontend↔backend endpoint connections.
> **Last updated:** 2026-07-09
> **API Gateway:** `https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com`
> **Auth:** AWS Cognito User Pool `ap-southeast-1_zGjdn5K3U` · Client `cpppgh9rt7kj1t3i5paej5526`

---

## Authentication Flow

| Step | Action | Frontend File | Backend |
|------|--------|---------------|---------|
| 1 | User submits credentials | `LoginTest.jsx` → `signIn()` | AWS Cognito |
| 2 | Session restored on reload | `App.jsx` → `fetchAuthSession()` | AWS Cognito |
| 3 | JWT attached to all requests | `api/axios.js` (request interceptor) | API Gateway Authorizer |
| 4 | User claims forwarded as headers | `api/axios.js` → decodes ID token | Lambda `extractUserContext()` |

### Headers sent on every authenticated request:
| Header | Source | Lambda reads as |
|--------|--------|----------------|
| `Authorization: Bearer <accessToken>` | Cognito Access Token | API Gateway JWT Authorizer |
| `x-user-id` | ID token `sub` claim | `userContext.userId` |
| `x-user-role` | ID token `cognito:groups` → Admin/Business/Customer | `userContext.role` |
| `x-user-email` | ID token `email` claim | (informational) |
| `x-business-id` | ID token `custom:businessId` or sub (if Business role) | `userContext.businessId` |

---

## Product Service

**Lambda Handler:** `backend/product-service/products.js`
**Frontend API Module:** `frontend/src/api/products.js`

| Method | Path | Frontend Function | Used In | Lambda Handler |
|--------|------|-------------------|---------|----------------|
| `GET` | `/products` | `getProducts()` | `ProductsPage.jsx` | `GET /products` |
| `GET` | `/products/{productId}` | `getProductById(id)` | `ProductDetailPage.jsx` | `GET /products/:id` |
| `POST` | `/products` | _(admin only — not yet wired to UI)_ | `AdminPage.jsx` (future) | `POST /products` |
| `PUT` | `/products/{productId}` | _(admin only)_ | — | `PUT /products/:id` |
| `DELETE` | `/products/{productId}` | _(admin only)_ | — | `DELETE /products/:id` |

### Field mapping (Lambda → Frontend):
| Lambda field | Frontend field | Notes |
|---|---|---|
| `productId` | `id` | Used as route param at `/products/:id` |
| `title` | `name` | Displayed in product cards |
| `msrp` | `price` | Used for cart subtotals |
| `imageUrl` | `image` | Falls back to Unsplash placeholder |

---

## Cart Service

**Lambda Handler:** `backend/cart-service/cart.js`
**Frontend API Module:** `frontend/src/api/cart.js`
**State Manager:** `frontend/src/context/AppContext.jsx`

| Method | Path | Frontend Function | Used In | Lambda Route |
|--------|------|-------------------|---------|--------------|
| `GET` | `/cart` | `getCartItems()` | `AppContext` (on mount) | `GET /cart` |
| `GET` | `/cart/summary` | `getCartSummary()` | `CartPage.jsx` (future) | `GET /cart/summary` |
| `POST` | `/cart/items` | `addCartItem({productId, quantity})` | `AppContext.addToCart()` | `POST /cart/items` |
| `PUT` | `/cart/items/{productId}` | `updateCartItem(productId, {quantity})` | `AppContext.updateQuantity()` | `PUT /cart/items/:id` |
| `DELETE` | `/cart/items/{productId}` | `deleteCartItem(productId)` | `AppContext.removeFromCart()` | `DELETE /cart/items/:id` |
| `DELETE` | `/cart/clear` | `clearCart()` | `AppContext.clearCartItems()` | `DELETE /cart/clear` |
| `POST` | `/cart/bulk-import` | `bulkImportCart(items)` | _(B2B future)_ | `POST /cart/bulk-import` |

### Field mapping (Lambda → Frontend):
| Lambda field | Frontend field | Notes |
|---|---|---|
| `productId` | Used as cart item key | Previously incorrectly used `id` |
| `productTitle` | Displayed in cart UI | |
| `unitPrice` | Per-unit price | Previously read as `price` |
| `subtotal` | Line total | `unitPrice × quantity` |

> ⚠️ **Fixed Bug:** `getCartItems` previously called `GET /cart/items` (404). Now correctly calls `GET /cart`.

---

## Order Service

**Lambda Handler:** `backend/order-service/orders.js`
**Frontend API Module:** `frontend/src/api/orders.js`
**State Manager:** `frontend/src/context/AppContext.jsx`

| Method | Path | Frontend Function | Used In | Lambda Route |
|--------|------|-------------------|---------|--------------|
| `GET` | `/orders` | `getOrders()` | `OrdersPage.jsx`, `ProfilePage.jsx` | `GET /orders` |
| `GET` | `/orders/{orderId}` | `getOrderById(orderId)` | _(future order detail page)_ | `GET /orders/:id` |
| `POST` | `/orders` | `createOrder({notes})` | `CheckoutPage.jsx` | `POST /orders` |
| `PUT` | `/orders/{orderId}/cancel` | `cancelOrder(orderId)` | `OrdersPage.jsx` (future) | `PUT /orders/:id/cancel` |
| `PUT` | `/orders/{orderId}` | `updateOrder(orderId, data)` | `AdminPage.jsx` (future) | `PUT /orders/:id` |
| `DELETE` | `/orders/{orderId}` | _(admin only)_ | — | `DELETE /orders/:id` |

### Idempotency
`createOrder()` automatically sends a unique `Idempotency-Key` header to prevent duplicate order creation on network retry.

### Order flow (Checkout → Order Service):
```
CheckoutPage → createOrder() → POST /orders
  ↳ Lambda reads cart from DynamoDB (CART#userId)
  ↳ Validates product prices from product table
  ↳ Writes ORDER#uuid to order table
  ↳ Deletes cart items (transactional)
  ↳ Publishes ORDER_CREATED event to SQS
  ↳ Returns { order: { orderId, totalAmount, orderStatus } }
CheckoutPage → createPaymentIntent({ orderId }) → POST /payments/intent
  ↳ Returns { paymentId, clientSecret }
```

---

## Payment Service

**Lambda Handler:** `backend/payment-service/payments.js`
**Frontend API Module:** `frontend/src/api/payments.js`

| Method | Path | Frontend Function | Used In | Lambda Route |
|--------|------|-------------------|---------|--------------|
| `GET` | `/payments` | `getPayments()` | `AdminPage.jsx` | `GET /payments` |
| `POST` | `/payments` | `createPayment(data)` | _(future)_ | `POST /payments` |
| `POST` | `/payments/intent` | `createPaymentIntent({orderId})` | `CheckoutPage.jsx` | `POST /payments/intent` |
| `POST` | `/payments/verify` | `verifyPayment(data)` | _(future)_ | `POST /payments/verify` |
| `POST` | `/payments/capture` | `capturePayment(data)` | `AdminPage.jsx` (future) | `POST /payments/capture` |
| `POST` | `/payments/refund` | `refundPayment(data)` | `AdminPage.jsx` (future) | `POST /payments/refund` |
| `POST` | `/payments/cancel` | `cancelPayment(data)` | `AdminPage.jsx` (future) | `POST /payments/cancel` |
| `POST` | `/payments/po-verify` | `verifyPurchaseOrder(data)` | _(B2B future)_ | `POST /payments/po-verify` |
| `POST` | `/payments/webhook` | _(server-side only)_ | — | `POST /payments/webhook` |

> **Note:** Payment gateway is internal (no Stripe). `createPaymentIntent` returns an internal `clientSecret` for reference.

---

## Inventory Service

**Lambda Handler:** `backend/inventory-service/inventory.js`
**Frontend API Module:** `frontend/src/api/inventory.js`

| Method | Path | Frontend Function | Used In | Lambda Route |
|--------|------|-------------------|---------|--------------|
| `GET` | `/inventory` | `getInventory()` | `AdminPage.jsx` | `GET /inventory` |
| `GET` | `/inventory/{productId}` | `getInventoryByProduct(id)` | `ProductDetailPage.jsx` (future) | `GET /inventory/:id` |
| `POST` | `/inventory` | `createInventoryRecord(data)` | `AdminPage.jsx` (future) | `POST /inventory` |
| `PATCH` | `/inventory/reserve` | `reserveInventory(data)` | _(order flow future)_ | `PATCH /inventory/reserve` |

---

## Page → Service Connection Matrix

| Page | Product | Cart | Orders | Payments | Inventory | Cognito |
|------|---------|------|--------|----------|-----------|---------|
| `ProductsPage` | ✅ GET list | — | — | — | — | ✅ JWT |
| `ProductDetailPage` | ✅ GET by ID | — | — | — | — | ✅ JWT |
| `CartPage` | — | ✅ GET, PUT, DELETE, CLEAR | — | — | — | ✅ JWT |
| `CheckoutPage` | — | ✅ (via context) | ✅ POST | ✅ Intent | — | ✅ JWT |
| `OrdersPage` | — | — | ✅ GET list | — | — | ✅ JWT |
| `ProfilePage` | — | — | ✅ GET list | — | — | ✅ Session |
| `AdminPage` | — | — | ✅ GET list | ✅ GET list | ✅ GET list | ✅ JWT |
| `WishlistPage` | — | ✅ addToCart | — | — | — | ✅ JWT |

---

## Known Gaps / Future Work

| Gap | Status | Notes |
|-----|--------|-------|
| Inventory check on product detail page | 🔲 Future | `getInventoryByProduct(id)` is ready in API module |
| Order cancellation UI on OrdersPage | 🔲 Future | `cancelOrder()` is ready in API module |
| Admin product management | 🔲 Future | POST/PUT/DELETE `/products` available |
| Cognito custom:role attribute | 🔲 Pending | Currently using `cognito:groups`; add custom:role for fine-grained control |
| Payment capture/refund admin UI | 🔲 Future | API functions ready in `api/payments.js` |
| Real-time stock display on cart | 🔲 Future | Could poll `GET /inventory/{productId}` |

---

## Error Response Reference

All Lambda services return standard HTTP codes:

| Code | Meaning | Frontend handling |
|------|---------|-------------------|
| `200` | Success | Use response data |
| `201` | Resource created | Use response data |
| `400` | Bad request | Show user error message |
| `401` | No credentials | Redirect to login |
| `403` | Unauthorized / forbidden | Show permission error |
| `404` | Not found | Show not found UI |
| `409` | Conflict (duplicate/stock) | Show specific conflict message |
| `422` | Validation failed | Show field errors |
| `500` | Internal Lambda error | Show generic error |

---

*This file is maintained alongside code changes. Update whenever new endpoints are wired to frontend pages.*
