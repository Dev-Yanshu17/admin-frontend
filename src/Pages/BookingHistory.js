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

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (bookingId) {
      loadBooking();
      loadHistory();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/payment-history/${bookingId}`);
      setBooking(res.data.data);
    } catch (err) {
      console.error("Error loading booking:", err);
      alert("Failed to load booking");
    }
  };

 const loadHistory = async () => {
  try {
    const res = await api.get(`/payment-history?bookingId=${bookingId}`);

    const historyData = res.data.data;

    if (historyData) {
      setBooking(historyData);          // 🔥 use history document
      setHistory(historyData.payments || []);
    } else {
      setBooking(null);
      setHistory([]);
    }
  } catch (err) {
    console.error("Error loading history:", err);
    setHistory([]);
  }
};

  const totalAmount = booking?.totalAmount || 0;
  const advancePayment = booking?.advancePayment || 0;
  const pendingAmount = booking?.pendingAmount || 0;

  /* ================= ADD PAYMENT ================= */
  const addPayment = async (e) => {
    e.preventDefault();

    if (!bookingId) {
      alert("Invalid booking");
      return;
    }

    if (!form.amountReceived || Number(form.amountReceived) <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (!form.paymentReceivedDate) {
      alert("Select payment date");
      return;
    }

    if (Number(form.amountReceived) > pendingAmount) {
      alert("Amount exceeds pending payment");
      return;
    }

    setLoading(true);

    try {
      await api.post("/payment-history/add-payment", {
        bookingId,
        amountReceived: Number(form.amountReceived),
        paymentMethod: form.paymentMethod,
        paymentDetails: form.paymentDetails,
        paymentReceivedDate: form.paymentReceivedDate,
      });

      // 🔥 Optimistic UI update (instant status change)
      setBooking((prev) => ({
        ...prev,
        pendingAmount: prev.pendingAmount - Number(form.amountReceived),
      }));

      setForm({
        amountReceived: "",
        paymentMethod: "cash",
        paymentReceivedDate: "",
        paymentDetails: {},
      });

      loadHistory();
    } catch (err) {
      console.error(err.response?.data || err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Payment Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (v) =>
    new Intl.NumberFormat("en-IN").format(v || 0);

  return (
    <div className="booking-container">
      <h2 className="page-title">Booking Payment History</h2>

      {booking && (
        <div className="summary-box">
          <div><b>House Number:</b> {booking.houseNumber}</div>
          <div><b>Total Amount:</b> ₹{formatINR(totalAmount)}</div>
          <div><b>Booking Amount:</b> ₹{formatINR(advancePayment)}</div>
          <div>
            <b>Status:</b>{" "}
            {pendingAmount === 0 ? (
              <span style={{ color: "green", fontWeight: "bold" }}>SOLD</span>
            ) : (
              <span style={{ color: "red", fontWeight: "bold" }}>
                ₹{formatINR(pendingAmount)} Pending
              </span>
            )}
          </div>
        </div>
      )}

      {pendingAmount > 0 && (
        <form onSubmit={addPayment} className="booking-form">
          <input
            required
            type="number"
            placeholder="Amount Received"
            value={form.amountReceived}
            max={pendingAmount}
            onChange={(e) =>
              setForm({ ...form, amountReceived: e.target.value })
            }
          />

          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.target.value })
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
          </select>

          {form.paymentMethod === "upi" && (
            <input
              placeholder="UPI Transaction ID"
              onChange={(e) =>
                setForm({
                  ...form,
                  paymentDetails: { upiTxnId: e.target.value },
                })
              }
            />
          )}

          {form.paymentMethod === "bank" && (
            <>
              <input
                placeholder="Bank Name"
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
                placeholder="Transaction ID"
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentDetails: {
                      ...form.paymentDetails,
                      transactionId: e.target.value,
                    },
                  })
                }
              />
            </>
          )}

          {form.paymentMethod === "cheque" && (
            <input
              placeholder="Cheque Number"
              onChange={(e) =>
                setForm({
                  ...form,
                  paymentDetails: { chequeNo: e.target.value },
                })
              }
            />
          )}

          {form.paymentMethod === "card" && (
            <input
              placeholder="Last 4 digits"
              maxLength={4}
              onChange={(e) =>
                setForm({
                  ...form,
                  paymentDetails: { last4Digits: e.target.value },
                })
              }
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
      let remaining = totalAmount;

      return history.map((h, index) => {
        remaining = remaining - h.amountReceived;

        return (
          <tr key={index}>
            <td>
              {new Date(h.paymentReceivedDate).toLocaleDateString()}
            </td>
            <td>{h.paymentMethod.toUpperCase()}</td>
            <td>₹{formatINR(h.amountReceived)}</td>
            <td>
              {remaining <= 0 ? (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  SOLD
                </span>
              ) : (
                <>₹{formatINR(remaining)}</>
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