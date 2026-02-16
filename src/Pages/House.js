import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./House.css";

export default function Bookings() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [projects, setProjects] = useState([]);
  const [houses, setHouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    projectId: "",
    houseNumber: "",
    customerName: "",
    mobileNo: "",
    paymentType: "cash",
    totalSqFeet: "",
    pricePerSqFeet: "",
    totalAmount: "",
    advancePayment: "",
    pendingAmount: "",
    bookingDate: today,
  });

  useEffect(() => {
    loadProjects();
    loadBookings();
  }, []);

  useEffect(() => {
    const handleFocus = () => loadBookings();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadProjects = async () => {
    const res = await api.get("/lily");
    setProjects(res.data.data);
  };

  const loadBookings = async () => {
    const res = await api.get("/bookings");
    setBookings(res.data.data);
  };

  const projectMap = {};
  projects.forEach((p) => (projectMap[p.id] = p.projectName));

  const handleProjectChange = async (pid) => {
    setForm({
      projectId: pid,
      houseNumber: "",
      customerName: "",
      mobileNo: "",
      paymentType: "cash",
      totalSqFeet: "",
      pricePerSqFeet: "",
      totalAmount: "",
      advancePayment: "",
      pendingAmount: "",
      bookingDate: today,
    });

    try {
      const res = await api.get(`/lily/houses/${pid}`);
      setHouses(res.data.data.filter((h) => h.status === "available"));
    } catch {
      setHouses([]);
    }
  };

  const handleHouseChange = (houseNo) => {
    const house = houses.find((h) => h.houseNumber === houseNo);
    const totalSqFeet = house?.totalSqFeet || 0;
    const pricePerSqFeet = house?.pricePerSqFeet || 0;
    const totalAmount = totalSqFeet * pricePerSqFeet;

    setForm((prev) => ({
      ...prev,
      houseNumber: houseNo,
      totalSqFeet,
      pricePerSqFeet,
      totalAmount,
      pendingAmount: totalAmount - Number(prev.advancePayment || 0),
    }));
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/bookings/create", {
        projectId: Number(form.projectId),
        houseNumber: form.houseNumber,
        customerName: form.customerName,
        mobileNo: form.mobileNo,
        paymentType: form.paymentType,
        totalSqFeet: Number(form.totalSqFeet),
        pricePerSqFeet: Number(form.pricePerSqFeet),
        advancePayment: Number(form.advancePayment),
        bookingDate: form.bookingDate,
      });

      alert("✅ Booking Created");

      setForm({
        projectId: "",
        houseNumber: "",
        customerName: "",
        mobileNo: "",
        paymentType: "cash",
        totalSqFeet: "",
        pricePerSqFeet: "",
        totalAmount: "",
        advancePayment: "",
        pendingAmount: "",
        bookingDate: today,
      });

      setHouses([]);
      loadBookings();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <h2 className="page-title">Create Booking</h2>

      <form onSubmit={submitBooking} className="booking-form">
        <label>Booking Date</label>
        <input
          type="date"
          value={form.bookingDate}
          max={today}
          required
          onChange={(e) =>
            setForm({ ...form, bookingDate: e.target.value })
          }
        />

        <label>Select Project</label>
        <select
          required
          value={form.projectId}
          onChange={(e) => handleProjectChange(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>

        <label>Select House</label>
        <select
          required
          value={form.houseNumber}
          onChange={(e) => handleHouseChange(e.target.value)}
        >
          <option value="">Select House</option>
          {houses.map((h) => (
            <option key={h.houseNumber} value={h.houseNumber}>
              {h.houseNumber}
            </option>
          ))}
        </select>

        <label>Customer Name</label>
        <input
          required
          value={form.customerName}
          onChange={(e) =>
            setForm({ ...form, customerName: e.target.value })
          }
        />

        <label>Mobile No</label>
        <input
          required
          maxLength={10}
          value={form.mobileNo}
          onChange={(e) =>
            setForm({ ...form, mobileNo: e.target.value })
          }
        />

        <label>Total Sq.Ft</label>
        <input
          type="number"
          value={form.totalSqFeet}
          onChange={(e) => {
            const sqFt = Number(e.target.value || 0);
            const price = Number(form.pricePerSqFeet || 0);
            const total = sqFt * price;

            setForm((prev) => ({
              ...prev,
              totalSqFeet: sqFt,
              totalAmount: total,
              pendingAmount: total - Number(prev.advancePayment || 0),
            }));
          }}
        />

        <label>Price per Sq.Ft</label>
        <input
          type="number"
          value={form.pricePerSqFeet}
          onChange={(e) => {
            const price = Number(e.target.value || 0);
            const sqFt = Number(form.totalSqFeet || 0);
            const total = sqFt * price;

            setForm((prev) => ({
              ...prev,
              pricePerSqFeet: price,
              totalAmount: total,
              pendingAmount: total - Number(prev.advancePayment || 0),
            }));
          }}
        />

        <label>Total Amount</label>
        <input readOnly value={form.totalAmount} />

        <label>Booking Amount</label>
        <input
          type="number"
          value={form.advancePayment}
          onChange={(e) => {
            const adv = Number(e.target.value || 0);
            setForm((prev) => ({
              ...prev,
              advancePayment: adv,
              pendingAmount: Number(prev.totalAmount || 0) - adv,
            }));
          }}
        />

        <label>Pending Amount</label>
        <input readOnly value={form.pendingAmount} />

        <button disabled={loading}>
          {loading ? "Booking..." : "Book House"}
        </button>
      </form>

      <h2 className="page-title">Booking List</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Project</th>
            <th>House</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Advance</th>
            <th>Pending</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.bookingId}</td>
              <td>{projectMap[b.projectId]}</td>
              <td>{b.houseNumber}</td>
              <td>{b.customerName}</td>
              <td>{b.paymentType.toUpperCase()}</td>
              <td>₹{b.totalAmount}</td>
              <td>₹{b.advancePayment}</td>
              <td>
                {b.pendingAmount <= 0 ? (
                  <strong style={{ color: "green" }}>SOLD</strong>
                ) : (
                  `₹${b.pendingAmount}`
                )}
              </td>
              <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
              <td>
                <button
                  className="history-btn"
                  onClick={() =>
                    navigate(`/booking-history/${b._id}`)
                  }
                >
                  Payment History
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
