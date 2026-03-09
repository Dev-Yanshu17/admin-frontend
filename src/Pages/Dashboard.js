import { useEffect, useState, useMemo } from "react";
import api from "../api";
import "./Dashboard.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [allInquiries, setAllInquiries] = useState([]);
  const [projectBookings, setProjectBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);
  const [todayBookingAmount, setTodayBookingAmount] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);

  /* ================= FETCH DATA ================= */

  const fetchDashboardData = async () => {
    try {
      const [projectRes, inquiryRes, bookingRes, projectListRes] =
        await Promise.all([
          api.get("/lily/count"),
          api.get("/contact"),
          api.get("/bookings"),
          api.get("/lily"),
        ]);

      setTotalProjects(projectRes?.data?.totalProjects || 0);

      const inquiries = inquiryRes?.data || [];
      setAllInquiries(inquiries);
      setTotalInquiries(inquiries.length);

      setProjectBookings(bookingRes?.data?.data || []);

      const bookings = bookingRes?.data?.data || [];

setProjectBookings(bookings);
setTotalBookings(bookings.length);

// ✅ Calculate today's booking amount
const today = new Date().toISOString().split("T")[0];

const todayTotal = bookings
  .filter((b) => {
    const bookingDate = new Date(b.bookingDate)
      .toISOString()
      .split("T")[0];
    return bookingDate === today;
  })
  .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

setTodayBookingAmount(todayTotal);

      // 🔔 Last 7 days inquiries
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      const filtered = inquiries
        .filter((item) => {
          const createdTime = new Date(item.createdAt);
          return now - createdTime <= oneWeek;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRecentInquiries(filtered);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ================= CITY COUNT ================= */

  const cityCount = useMemo(() => {
    return allInquiries.reduce((acc, item) => {
      const city = item.location || "Unknown";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
  }, [allInquiries]);

  /* ================= PROJECT BOOKING COUNT ================= */

  const projectBookingCount = useMemo(() => {
    const map = {};

    projectBookings.forEach((booking) => {
      const projectId = booking.projectId;
      map[projectId] = (map[projectId] || 0) + 1;
    });

    return map;
  }, [projectBookings]);

  // Map projectId to projectName
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      map[p.id] = p.projectName;
    });
    return map;
  }, [projects]);

  /* ================= CHART DATA ================= */

  const cityChartData = {
    labels: Object.keys(cityCount),
    datasets: [
      {
        label: "Inquiries per City",
        data: Object.values(cityCount),
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        borderWidth: 3,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const projectChartData = {
    labels: Object.keys(projectBookingCount).map(
      (id) => projectMap[id] || `Project ${id}`
    ),
    datasets: [
      {
        label: "Bookings per Project",
        data: Object.values(projectBookingCount),
        backgroundColor: "#16a34a",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
  };

  /* ================= UI ================= */

  return (
    <div className="dashboard">
      <h1>Welcome to Dream D'wello....</h1>

      {/* 📊 TOTAL PROJECT CARD */}
    <div className="stats-grid">

  <div className="stat-card">
    <h3>Total Projects</h3>
    <p className="stat-number">{totalProjects}</p>
  </div>

  <div className="stat-card">
    <h3>Total Bookings</h3>
    <p className="stat-number">{totalBookings}</p>
  </div>

  <div className="stat-card">
    <h3>Today's Booking Amount</h3>
    <p className="stat-number">
      ₹{new Intl.NumberFormat("en-IN").format(todayBookingAmount)}
    </p>
  </div>
  
  <div className="stat-card">
    <h3>Total Inquiries</h3>
    <p className="stat-number">{totalInquiries}</p>
  </div>

</div>

      <div className="dashboard-row">

{/* 🔔 LAST WEEK INQUIRIES */}
<div className="notification-box">
  <h2>New Inquiries</h2>
  
  <div className="notification-list">
    {loading ? (
      <div className="loading-state">Loading inquiries...</div>
    ) : recentInquiries.length === 0 ? (
      <div className="no-data-state">No new inquiries this week</div>
    ) : (
      recentInquiries.map((item) => (
        <div key={item._id} className="notification-item">
          <div className="notification-item-left">
            <strong>{item.firstName}</strong>
            <span className="location">{item.location}</span>
          </div>
          <span className="date">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))
    )}
  </div>
</div>

{/* 📈 CITY CHART */}
<div className="small-chart-box">
  <h3>City Wise Inquiry Summary</h3>
  <div className="chart-wrapper">
    {loading ? (
      <div className="loading-state">Loading chart...</div>
    ) : (
      <Line data={cityChartData} options={chartOptions} />
    )}
  </div>
</div>

{/* 📊 PROJECT BOOKING CHART */}
<div className="small-chart-box">
  <h3>Project Wise Booking Summary</h3>
  <div className="chart-wrapper">
    {loading ? (
      <div className="loading-state">Loading chart...</div>
    ) : (
      <Bar data={projectChartData} options={chartOptions} />
    )}
  </div>
</div>

      </div>
    </div>
  );
}