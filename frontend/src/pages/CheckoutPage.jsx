import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, LockKeyhole } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { createPaymentIntent, updatePayment } from "../api/payments";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Shipping", "Billing", "Review", "Payment", "Confirmation"];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, createOrder, user } = useAppContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Shipping form state
  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // ── Cart totals ──
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1),
    0,
  );
  const tax = subtotal * 0.08;
  const shippingFee = subtotal > 15000 ? 0 : 650;
  const total = subtotal + tax + shippingFee;

  const handleShippingChange = (e) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Place order + create payment intent ──
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty. Add items before placing an order.");
      return;
    }
    setLoading(true);
    setProcessingPayment(true);
    setError("");

    try {
      // 1) Create order from current cart (Lambda reads cart from DynamoDB)
      const orderData = await createOrder(
        `Ship to: ${shipping.fullName}, ${shipping.address}, ${shipping.city} - ${shipping.pincode}`,
      );
      const order = orderData.order;

      // 2) Create internal payment intent
      const intentData = await createPaymentIntent({ orderId: order.orderId });
      const paymentId = intentData.paymentId;

      // UX Simulate secure connection and processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 3) Mark payment as PAID in backend
      await updatePayment(paymentId, {
        paymentStatus: "PAID",
        transactionReference: `INTERNAL-TXN-${Date.now()}`,
      });

      // Manually update the local order obj so the UI reflects the cascade
      order.orderStatus = "CONFIRMED";

      setConfirmedOrder(order);
      setStep(5); // Jump to confirmation
    } catch (err) {
      console.error("[Checkout] Order failed:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong during payment processing. Please try again.",
      );
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // ── Confirmation screen ──
  if (step === 5 && confirmedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl px-4 py-16 lg:px-8 text-center"
      >
        <div className="rounded-[2rem] border border-stone-200 bg-white p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <CheckCircle2
              className="mx-auto text-emerald-500"
              size={64}
              strokeWidth={1.5}
            />
          </motion.div>
          <h1 className="mt-6 text-3xl font-medium tracking-tight text-stone-900">
            Order Confirmed!
          </h1>
          <p className="mt-3 text-stone-600">
            Thank you for your purchase. Your exquisite pieces will be on their
            way soon.
          </p>
          <div className="mt-8 rounded-[1.5rem] bg-stone-50 p-6 text-left text-sm text-stone-700 border border-stone-100">
            <div className="flex justify-between border-b border-stone-200 pb-3">
              <span className="font-semibold text-stone-900">Order ID</span>
              <span className="font-mono">
                #{confirmedOrder.orderId?.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between border-b border-stone-200 py-3">
              <span className="font-semibold text-stone-900">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {confirmedOrder.orderStatus?.replaceAll(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="font-semibold text-stone-900">Total Paid</span>
              <span className="font-medium text-stone-900">
                ₹
                {Number(confirmedOrder.totalAmount || total).toLocaleString(
                  "en-IN",
                )}
              </span>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/orders")}
              className="rounded-2xl bg-stone-900 px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              id="goto-orders-btn"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate("/jewelry")}
              className="rounded-2xl border border-stone-200 px-8 py-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              id="continue-shopping-btn"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="relative rounded-[2.5rem] border border-stone-200 bg-white p-8 lg:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Payment Processing Overlay */}
        <AnimatePresence>
          {processingPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
            >
              <div className="text-center flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-6 h-16 w-16 rounded-full border-[3px] border-stone-200 border-t-amber-700"
                />
                <h3 className="text-2xl font-medium text-stone-900">
                  Processing Payment
                </h3>
                <p className="mt-2 text-stone-500 flex items-center gap-2 justify-center">
                  <LockKeyhole size={14} /> Securely communicating with
                  gateway...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          Secure Checkout
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-stone-900">
          Complete your acquisition
        </h1>

        {/* Step indicator */}
        <div className="mt-10 flex flex-wrap items-center gap-3 text-sm font-medium">
          {STEPS.map((label, index) => {
            const isCompleted = step > index + 1;
            const isActive = step === index + 1;
            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`flex h-8 items-center rounded-full px-4 transition-all duration-300 ${
                    isActive
                      ? "bg-stone-900 text-white shadow-md"
                      : isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-stone-50 text-stone-400"
                  }`}
                >
                  {isCompleted && <CheckCircle2 size={14} className="mr-1.5" />}
                  {label}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-[1px] w-4 ${isCompleted ? "bg-emerald-200" : "bg-stone-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[1rem] bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 border border-rose-100">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {/* Left — Step content */}
          <div className="rounded-[2rem] border border-stone-200 bg-stone-50/50 p-8">
            <AnimatePresence mode="wait">
              {/* Step 1 — Shipping */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h2 className="text-xl font-medium text-stone-900">
                    Shipping details
                  </h2>
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <input
                      id="shipping-name"
                      name="fullName"
                      value={shipping.fullName}
                      onChange={handleShippingChange}
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                      placeholder="Full Name"
                    />
                    <input
                      id="shipping-phone"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingChange}
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                      placeholder="Phone"
                    />
                    <input
                      id="shipping-address"
                      name="address"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-100 md:col-span-2"
                      placeholder="Address"
                    />
                    <input
                      id="shipping-city"
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                      placeholder="City"
                    />
                    <input
                      id="shipping-pincode"
                      name="pincode"
                      value={shipping.pincode}
                      onChange={handleShippingChange}
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-100"
                      placeholder="Pincode"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Billing */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h2 className="text-xl font-medium text-stone-900">
                    Billing details
                  </h2>
                  <div className="mt-6 space-y-4">
                    <label className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 cursor-pointer transition-colors hover:bg-stone-50">
                      <input
                        type="radio"
                        name="billing"
                        defaultChecked
                        className="h-5 w-5 accent-stone-900"
                      />
                      <span className="text-sm font-medium text-stone-700">
                        Same as shipping address
                      </span>
                    </label>
                    <label className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 cursor-pointer transition-colors hover:bg-stone-50">
                      <input
                        type="radio"
                        name="billing"
                        className="h-5 w-5 accent-stone-900"
                      />
                      <span className="text-sm font-medium text-stone-700">
                        Use a different billing address
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h2 className="text-xl font-medium text-stone-900">
                    Review your order
                  </h2>
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-stone-500">Your cart is empty.</p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.productId || item.SK}
                          className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-stone-900">
                              {item.productTitle || item.name || "Product"}
                            </p>
                            <p className="mt-1 text-sm text-stone-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-stone-900">
                            ₹
                            {(
                              Number(item.unitPrice || item.price || 0) *
                              item.quantity
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4 — Payment */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h2 className="text-xl font-medium text-stone-900">
                    Payment
                  </h2>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <ShieldCheck size={16} className="text-amber-600" />
                    Secure internal payment gateway active.
                  </div>
                  <div className="mt-6 space-y-4">
                    <label className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 cursor-pointer hover:bg-stone-50 transition-colors relative overflow-hidden group">
                      <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input
                        type="radio"
                        name="payment"
                        defaultChecked
                        className="h-5 w-5 accent-stone-900"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-stone-900">
                          Credit or Debit Card
                        </span>
                        <span className="block text-xs text-stone-500 mt-1">
                          Processed securely
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 cursor-pointer hover:bg-stone-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        className="h-5 w-5 accent-stone-900"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-stone-900">
                          Bank Transfer
                        </span>
                        <span className="block text-xs text-stone-500 mt-1">
                          NEFT / RTGS
                        </span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0}
                    id="place-order-btn"
                    className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-5 text-base font-medium text-white transition-all hover:bg-stone-800 hover:shadow-lg disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>Confirm & Pay ₹{total.toLocaleString("en-IN")}</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons (steps 1-3) */}
            {step < 4 && (
              <div className="mt-10 flex items-center justify-between border-t border-stone-200 pt-8">
                <button
                  onClick={() => setStep((p) => Math.max(1, p - 1))}
                  className={`rounded-2xl border border-stone-200 px-6 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 ${
                    step === 1 ? "invisible" : ""
                  }`}
                  id="checkout-back-btn"
                >
                  Go Back
                </button>
                <button
                  onClick={() => setStep((p) => Math.min(4, p + 1))}
                  className="rounded-2xl bg-stone-900 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-stone-800 hover:shadow-md"
                  id="checkout-continue-btn"
                >
                  Continue to {STEPS[step]}
                </button>
              </div>
            )}
          </div>

          {/* Right — Order Preview */}
          <div className="rounded-[2rem] border border-stone-200 p-8 bg-white h-fit shadow-sm">
            <h2 className="text-xl font-medium text-stone-900">
              Order Preview
            </h2>
            <div className="mt-8 space-y-4 text-sm">
              {cart.length === 0 ? (
                <p className="text-stone-400">No items in cart.</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId || item.SK}
                    className="flex justify-between items-center group"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-stone-800 truncate pr-2 max-w-[200px]">
                        {item.productTitle || item.name || "Product"}
                      </span>
                      <span className="text-stone-400 text-xs mt-0.5">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium text-stone-900">
                      ₹
                      {(
                        Number(item.unitPrice || item.price || 0) *
                        item.quantity
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-3 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-stone-800">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-stone-800">
                    {shippingFee === 0 ? "Complimentary" : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-stone-800">
                    ₹{tax.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-stone-50 p-5">
                <span className="text-base font-semibold text-stone-900">
                  Grand Total
                </span>
                <span className="text-xl font-semibold text-stone-900">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
