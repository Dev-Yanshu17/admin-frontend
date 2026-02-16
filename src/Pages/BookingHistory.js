import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./House.css";

export default function BookingHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amountReceived: "",
    paymentMethod: "cash",
    transactionId: "",
    paymentReceivedDate: new Date().toISOString().split("T")[0],
  });

  // ✅ Format Money in Indian Style
  const formatMoney = (amount) => {
    return Number(amount).toLocaleString("en-IN");
  };

  // Load Booking
  const loadBooking = async () => {
    const res = await api.get(`/booking-history/${id}`);
    setBooking(res.data.data);
  };

  // Load History
  const loadHistory = async () => {
    const res = await api.get(`/booking-history?bookingId=${id}`);
    setHistory(res.data.data);
  };

  useEffect(() => {
    loadBooking();
    loadHistory();
  }, [id]);

  // Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/booking-history/add-payment", {
        bookingId: id,
        amountReceived: Number(paymentForm.amountReceived),
        paymentMethod: paymentForm.paymentMethod,

        // ✅ Send Transaction ID properly
        paymentDetails: {
          transactionId: paymentForm.transactionId,
        },

        paymentReceivedDate: paymentForm.paymentReceivedDate,
      });

      alert("✅ Payment Added Successfully");

      // Reset Form
      setPaymentForm({
        amountReceived: "",
        paymentMethod: "cash",
        transactionId: "",
        paymentReceivedDate: new Date().toISOString().split("T")[0],
      });

      // ✅ Reload booking + history so pending updates
      loadBooking();
      loadHistory();
    } catch (error) {
      alert(error.response?.data?.message || "Payment Failed");
    }

    setLoading(false);
  };

  return (
    <div className="booking-container">
      <h2 className="page-title">Booking Payment History</h2>

      {/* Back */}
      <button
        className="history-btn"
        style={{ marginBottom: "15px" }}
        onClick={() => navigate("/bookings")}
      >
        ⬅ Back
      </button>

      {/* Booking Info */}
      {booking && (
        <div className="booking-form" style={{ marginBottom: "20px" }}>
          <h3>Booking Details</h3>

          <p>
            <strong>Customer:</strong> {booking.customerName}
          </p>

          <p>
            <strong>House No:</strong> {booking.houseNumber}
          </p>

          <p>
            <strong>Total Amount:</strong> ₹{formatMoney(booking.totalAmount)}
          </p>

          <p>
            <strong>Advance:</strong> ₹{formatMoney(booking.advancePayment)}
          </p>

          <p>
  <strong>Pending:</strong>{" "}
  {booking.pendingAmount <= 0 ? (
    <span style={{ color: "green", fontWeight: "bold" }}>SOLD</span>
  ) : (
    <span style={{ color: "red", fontWeight: "bold" }}>
      ₹{formatMoney(booking.pendingAmount)}
    </span>
  )}
</p>


        </div>
      )}

      {/* Add Payment Form */}
      {booking?.pendingAmount > 0 && (
        <>
          <h2 className="page-title">Add New Payment</h2>

          <form onSubmit={handleAddPayment} className="booking-form">
            {/* Amount */}
            <label>Amount Received</label>
            <input
              type="number"
              required
              value={paymentForm.amountReceived}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  amountReceived: e.target.value,
                })
              }
            />

            {/* Payment Method */}
            <label>Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentMethod: e.target.value,
                  transactionId: "",
                })
              }
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>

            {/* ✅ Show Transaction ID for Non-Cash */}
            {paymentForm.paymentMethod !== "cash" && (
              <>
                <label>
                  {paymentForm.paymentMethod === "upi"
                    ? "UPI Transaction ID"
                    : paymentForm.paymentMethod === "bank"
                    ? "Bank Transaction ID"
                    : paymentForm.paymentMethod === "cheque"
                    ? "Cheque Number"
                    : "Card Number"}
                </label>

                <input
                  required
                  value={paymentForm.transactionId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      transactionId: e.target.value,
                    })
                  }
                />
              </>
            )}

            {/* Payment Date */}
            <label>Payment Date</label>
            <input
              type="date"
              required
              value={paymentForm.paymentReceivedDate}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentReceivedDate: e.target.value,
                })
              }
            />

            <button disabled={loading}>
              {loading ? "Saving..." : "Add Payment"}
            </button>
          </form>
        </>
      )}

      {/* Payment History Table */}
      <h2 className="page-title">Payment History List</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Transaction ID</th>
            <th>Pending After</th>
          </tr>
        </thead>

        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No Payment History Found
              </td>
            </tr>
          ) : (
            history.map((h) => (
              <tr key={h._id}>
                <td>
                  {new Date(h.paymentReceivedDate).toLocaleDateString("en-IN")}
                </td>

                <td>₹{formatMoney(h.amountReceived)}</td>

                <td>{h.paymentMethod.toUpperCase()}</td>

                <td>{h.paymentDetails?.transactionId || "-"}</td>

                <td>
                  {h.pendingAmount <= 0 ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      SOLD
                    </span>
                  ) : (
                    `₹${formatMoney(h.pendingAmount)}`
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}