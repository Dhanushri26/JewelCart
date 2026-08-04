import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, RefreshCw, ShoppingBag } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

export function CartPage() {
  const { cart, cartLoading, updateQuantity, removeFromCart, clearCartItems, loadCart } =
    useAppContext()

  // Cart item identifier: Lambda returns productId (not id)
  const getKey = (item) => item.productId ?? item.SK ?? item.id

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity ?? 1),
    0
  )
  const shipping = 0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">

        {/* Cart items panel */}
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Luxury Cart</p>
              <h1 className="mt-2 text-3xl text-stone-800">Your curated selection</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadCart}
                disabled={cartLoading}
                id="cart-refresh-btn"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                <RefreshCw size={12} className={cartLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link to="/jewelry" className="text-sm font-semibold text-stone-700">
                Continue shopping
              </Link>
            </div>
          </div>

          {/* Loading skeleton */}
          {cartLoading && cart.length === 0 && (
            <div className="mt-8 space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="animate-pulse flex gap-4 rounded-[1.25rem] border border-stone-200 p-4"
                >
                  <div className="h-24 w-24 rounded-2xl bg-stone-200" />
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-4 w-40 rounded-full bg-stone-200" />
                    <div className="h-3 w-24 rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Items list */}
          <div className="mt-8 space-y-4">
            {cart.map((item) => {
              const key = getKey(item)
              const unitPrice = Number(item.unitPrice ?? item.price ?? 0)
              const lineTotal = unitPrice * Number(item.quantity ?? 1)

              return (
                <div
                  key={key}
                  id={`cart-item-${key}`}
                  className="flex flex-col gap-4 rounded-[1.25rem] border border-stone-200 p-4 sm:flex-row sm:items-center"
                >
                  {/* Product image placeholder */}
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    {item.image ? (
                      <img src={item.image} alt={item.productTitle} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg text-stone-800">
                      {item.productTitle ?? item.name ?? 'Product'}
                    </h3>
                    <p className="mt-1 text-sm text-stone-500">
                      ₹{unitPrice.toLocaleString('en-IN')} each
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        id={`cart-dec-${key}`}
                        onClick={() => updateQuantity(key, Math.max(1, Number(item.quantity) - 1))}
                        className="rounded-full border border-stone-200 p-2 hover:bg-stone-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        id={`cart-inc-${key}`}
                        onClick={() => updateQuantity(key, Number(item.quantity) + 1)}
                        className="rounded-full border border-stone-200 p-2 hover:bg-stone-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-900">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </p>
                    <button
                      id={`cart-remove-${key}`}
                      onClick={() => removeFromCart(key)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-rose-700 hover:text-rose-900"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Empty state */}
            {cart.length === 0 && !cartLoading && (
              <div className="rounded-[1.25rem] border border-dashed border-stone-300 p-10 text-center text-stone-500">
                Your cart is ready for your next heirloom piece.
              </div>
            )}
          </div>

          {/* Clear cart */}
          {cart.length > 0 && (
            <button
              onClick={clearCartItems}
              id="clear-cart-btn"
              className="mt-4 text-sm text-stone-400 hover:text-rose-600"
            >
              Clear all items
            </button>
          )}
        </div>

        {/* Order summary panel */}
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl text-stone-800">Order Summary</h2>
          <div className="mt-6 space-y-3 text-sm text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%)</span>
              <span>₹{tax.toFixed(0)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
              <span>Grand Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <label className="mt-6 block rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            Coupon code{' '}
            <input className="ml-2 bg-transparent outline-none" placeholder="WELCOME10" id="coupon-input" />
          </label>
          <Link
            to="/checkout"
            id="proceed-to-checkout-btn"
            className="mt-6 block rounded-full bg-stone-900 px-5 py-3 text-center font-medium text-white hover:bg-stone-800"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
