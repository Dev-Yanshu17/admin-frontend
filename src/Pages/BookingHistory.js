import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./BookingHistory.css";

export default function BookingHistory() {
  const { bookingId } = useParams();

  const [history, setHistory] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    amountReceived: "",
    paymentMethod: "cash",
    paymentReceivedDate: "",
    paymentDetails: {},
  });

  useEffect(() => {
    if (bookingId) {
      loadBooking();
      loadHistory();
    }
  }, [bookingId]);

  // Load main booking info
  const loadBooking = async () => {
    const res = await api.get(`/payment-history/${bookingId}`);
    setBooking(res.data.data);
  };

  // Load all payment history
  const loadHistory = async () => {
    const res = await api.get(`/payment-history?bookingId=${bookingId}`);
    setHistory(res.data.data?.payments || []);
  };

  // Calculate current pending amount
  const getCurrentPending = () => {
  if (!booking) return 0;

  // ✅ Advance already exists inside history array
  const totalPaid = history.reduce(
    (sum, h) => sum + Number(h.amountReceived),
    0
  );

  const pending = booking.totalAmount - totalPaid;

  return pending < 0 ? 0 : pending;
};

  const currentPending = getCurrentPending();

  // Add a new payment
  const addPayment = async (e) => {
    e.preventDefault();

    if (Number(form.amountReceived) > currentPending)
      return alert("Amount exceeds pending");

    setLoading(true);

    try {
      await api.post("/payment-history/add-payment", {
        bookingId,
        amountReceived: Number(form.amountReceived),
        paymentMethod: form.paymentMethod,
        paymentDetails: form.paymentDetails,
        paymentReceivedDate: form.paymentReceivedDate,
      });

      // Reset form
      setForm({
        amountReceived: "",
        paymentMethod: "cash",
        paymentReceivedDate: "",
        paymentDetails: {},
      });

      // Reload data
      await loadHistory();
      await loadBooking();
    } finally {
      setLoading(false);
    }
  };

  // Format number as INR
  const formatINR = (v) => new Intl.NumberFormat("en-IN").format(v || 0);

  return (
    <div className="booking-container">
      <h2 className="page-title">Booking Payment History</h2>

      {booking && (
        <div className="summary-box">
          <div><b>House:</b> {booking.houseNumber}</div>
          <div><b>Total Amount:</b> ₹{formatINR(booking.totalAmount)}</div>
          <div><b>Advance Amount:</b> ₹{formatINR(booking.advancePayment)}</div>

          <div>
            <b>Status:</b>{" "}
            {currentPending <= 0 ? (
              <span style={{ color: "green", fontWeight: "bold" }}>
                SOLD
              </span>
            ) : (
              <span style={{ color: "red", fontWeight: "bold" }}>
                ₹{formatINR(currentPending)} Pending
              </span>
            )}
          </div>
        </div>
      )}

      {currentPending > 0 && (
        <form onSubmit={addPayment} className="booking-form">
          <input
            required
            type="number"
            max={currentPending}
            placeholder="Amount Received"
            value={form.amountReceived}
            onChange={(e) =>
              setForm({ ...form, amountReceived: e.target.value })
            }
          />

         <select
  value={form.paymentMethod}
  onChange={(e) =>
    setForm({
      ...form,
      paymentMethod: e.target.value,
      paymentDetails: {} // reset details when changing method
    })
  }
>
  <option value="cash">Cash</option>
  {/* <option value="upi">UPI</option> */}
  <option value="bank">Bank</option>
  <option value="cheque">Cheque</option>
  <option value="card">Card</option>
</select>

{/* 🔥 Dynamic Payment Fields */}

{form.paymentMethod === "bank" && (
  <>
    <input
      required
      placeholder="Bank Name"
      value={form.paymentDetails.bankName || ""}
      onChange={(e) =>
        setForm({
          ...form,
          paymentDetails: {
            ...form.paymentDetails,
            bankName: e.target.value,
          },
        })
      }
    />

    <input
      required
      type="number"
      maxLength={12}
      placeholder="Account Number (12 digits)"
      value={form.paymentDetails.accountNumber || ""}
      onChange={(e) => {
        if (e.target.value.length <= 12) {
          setForm({
            ...form,
            paymentDetails: {
              ...form.paymentDetails,
              accountNumber: e.target.value,
            },
          });
        }
      }}
    />
  </>
)}

{form.paymentMethod === "cheque" && (
  <input
    required
    type="number"
    placeholder="Cheque Number (12 digits)"
    value={form.paymentDetails.chequeNumber || ""}
    onChange={(e) => {
      if (e.target.value.length <= 12) {
        setForm({
          ...form,
          paymentDetails: {
            chequeNumber: e.target.value,
          },
        });
      }
    }}
  />
)}

{form.paymentMethod === "card" && (
  <input
    required
    type="number"
    placeholder="Card Number (16 digits)"
    value={form.paymentDetails.cardNumber || ""}
    onChange={(e) => {
      if (e.target.value.length <= 16) {
        setForm({
          ...form,
          paymentDetails: {
            cardNumber: e.target.value,
          },
        });
      }
    }}
  />
)}

          <input
            required
            type="date"
            value={form.paymentReceivedDate}
            onChange={(e) =>
              setForm({
                ...form,
                paymentReceivedDate: e.target.value,
              })
            }
          />

          <button disabled={loading}>
            {loading ? "Saving..." : "Add Payment"}
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Pending</th>
          </tr>
        </thead>
       <tbody>
  {history.length === 0 ? (
    <tr>
      <td colSpan="4">No payments yet</td>
    </tr>
  ) : (
    (() => {
      if (!booking) return null;

      // ✅ Advance first, then date ASC
      const sortedPayments = [...history].sort((a, b) => {
        // 🔥 Advance always first
        if (a.paymentMethod === "advance") return -1;
        if (b.paymentMethod === "advance") return 1;

        // Then sort by date
        return (
          new Date(a.paymentReceivedDate) -
          new Date(b.paymentReceivedDate)
        );
      });

      let runningPending = booking.totalAmount;

      return sortedPayments.map((h) => {
        runningPending -= Number(h.amountReceived);

        if (runningPending < 0) runningPending = 0;

        return (
          <tr key={h._id}>
            <td>
              {new Date(h.paymentReceivedDate).toLocaleDateString()}
            </td>
            <td>{h.paymentMethod.toUpperCase()}</td>
            <td>₹{formatINR(h.amountReceived)}</td>
            <td>
              {runningPending <= 0 ? (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  SOLD
                </span>
              ) : (
                <>₹{formatINR(runningPending)}</>
              )}
            </td>
          </tr>
        );
      });
    })()
  )}
</tbody>
      </table>
    </div>
  );
}
