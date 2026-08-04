import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  CheckCircle,
  Clock,
  Search,
  Pencil,
  Loader2,
  X,
} from "lucide-react";

import {
  getPayments,
  updatePayment,
} from "../../api/payments";

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    paymentStatus: "",
    transactionReference: "",
  });

  async function loadPayments() {
    setLoading(true);

    try {
      const data = await getPayments();
      setPayments(data.payments || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const text = search.toLowerCase();

      return (
        (p.paymentId || "").toLowerCase().includes(text) ||
        (p.orderId || "").toLowerCase().includes(text)
      );
    });
  }, [payments, search]);

  const totalPayments = payments.length;

  const paidPayments = payments.filter(
    (p) => p.paymentStatus === "PAID"
  ).length;

  const pendingPayments = payments.filter(
    (p) => p.paymentStatus === "PENDING"
  ).length;

  const revenue = payments
    .filter((p) => p.paymentStatus === "PAID")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  function openEdit(payment) {
    setEditing(payment);

    setForm({
      paymentStatus: payment.paymentStatus,
      transactionReference:
        payment.transactionReference || "",
    });
  }

  async function savePayment() {
    await updatePayment(editing.paymentId, form);

    setEditing(null);

    loadPayments();
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-semibold">
          Payments
        </h1>

        <p className="text-stone-400">
          Manage payment records.
        </p>
      </div>

      {/* Summary */}

      <div className="grid gap-4 md:grid-cols-4">

        <SummaryCard
          title="Payments"
          value={totalPayments}
          icon={<CreditCard />}
        />

        <SummaryCard
          title="Paid"
          value={paidPayments}
          icon={<CheckCircle />}
        />

        <SummaryCard
          title="Pending"
          value={pendingPayments}
          icon={<Clock />}
        />

        <SummaryCard
          title="Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          icon={<CreditCard />}
        />

      </div>

      {/* Search */}

      <div className="relative max-w-md">

        <Search
          className="absolute left-3 top-3.5 text-stone-500"
          size={18}
        />

        <input
          className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4"
          placeholder="Search payment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">

        <table className="w-full">

          <thead className="bg-stone-800">

            <tr>

              <th className="px-5 py-4 text-left">
                Payment
              </th>

              <th className="px-5 py-4 text-left">
                Order
              </th>

              <th className="px-5 py-4 text-left">
                Amount
              </th>

              <th className="px-5 py-4 text-left">
                Status
              </th>

              <th className="px-5 py-4 text-left">
                Reference
              </th>

              <th className="px-5 py-4"></th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center"
                >
                  <Loader2 className="mx-auto animate-spin" />
                </td>

              </tr>

            ) : (

              filteredPayments.map((payment) => (

                <tr
                  key={payment.paymentId}
                  className="border-t border-stone-800"
                >

                  <td className="px-5 py-4 font-mono">
                    #{payment.paymentId.substring(0, 8)}
                  </td>

                  <td className="px-5 py-4 font-mono">
                    #{payment.orderId.substring(0, 8)}
                  </td>

                  <td className="px-5 py-4">
                    ₹{Number(payment.amount).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs
                      ${
                        payment.paymentStatus === "PAID"
                          ? "bg-green-900 text-green-300"
                          : payment.paymentStatus === "FAILED"
                          ? "bg-red-900 text-red-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {payment.paymentStatus}
                    </span>

                  </td>

                  <td className="px-5 py-4">
                    {payment.transactionReference  ? (payment.transactionReference.substring(0, 8).toUpperCase()) : ("No Reference")}
                  </td>

                  <td className="px-5 py-4">

                    <button
                      onClick={() => openEdit(payment)}
                    >
                      <Pencil size={18} />
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* Edit Dialog */}

      {editing && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

          <div className="w-full max-w-md rounded-2xl bg-stone-900 p-6">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl">
                Edit Payment
              </h2>

              <button onClick={() => setEditing(null)}>
                <X />
              </button>

            </div>

            <div className="space-y-4">

              <select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentStatus: e.target.value,
                  })
                }
                className="w-full rounded-xl bg-stone-800 p-3"
              >
                <option>PENDING</option>
                <option>PAID</option>
                <option>FAILED</option>
                <option>REFUNDED</option>
              </select>

              <input
                className="w-full rounded-xl bg-stone-800 p-3"
                placeholder="Transaction Reference"
                value={form.transactionReference}
                onChange={(e) =>
                  setForm({
                    ...form,
                    transactionReference: e.target.value,
                  })
                }
              />

            </div>

            <button
              onClick={savePayment}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-medium text-black"
            >
              Save Changes
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
      <div className="flex items-center justify-between text-stone-400">
        <span>{title}</span>
        {icon}
      </div>

      <h2 className="mt-4 text-2xl font-semibold">
        {value}
      </h2>
    </div>
  );
}