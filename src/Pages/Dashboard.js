import { useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);


export default function Dashboard() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);

  
  useEffect(() => {
    api.get("/contact").then((res) => {
      setInquiries(res.data);
    });
  }, []);
  // 📊 Count entries city-wise
  const cityCount = inquiries.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(cityCount),
    datasets: [
      {
        label: "Inquiries per City",
        data: Object.values(cityCount),

        // BLUE LINE STYLING
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,

        tension: 0.4,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: {
          color: "#e5edff",
        },
      },
      x: {
        grid: {
          color: "#f1f5ff",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };


  const fetchDashboardData = async () => {
    try {
      const [projectRes, inquiryRes] = await Promise.all([
        api.get("/lily/count"),
        api.get("/contact"),
      ]);

      setTotalProjects(projectRes?.data?.totalProjects || 0);

      // Show only inquiries from last 7 days (1 week)
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds

      const lastWeekInquiries = inquiryRes.data.filter((item) => {
        const createdTime = new Date(item.createdAt);
        return now - createdTime <= oneWeek;
      });

      // newest first
      const sorted = lastWeekInquiries.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setRecentInquiries(sorted);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Projects</h3>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            <p className="stat-number">{totalProjects}</p>
          )}
        </div>
      </div>

      <div className="dashboard-row">
        {/* LAST WEEK INQUIRIES */}
      <div className="notification-box">
       
        <h2>New Inquiries (Last 7 Days)</h2>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : recentInquiries.length === 0 ? (
          <p className="no-data">No new inquiries this week</p>
        ) : (
          recentInquiries.map((item) => (
            <div key={item._id} className="notification-item">
              <div className="notify-left">
                <span className="dot"></span>
                <div>
                  <strong>{item.firstName}</strong>
                  <p>{item.location}</p>
                </div>
              </div>
              <span className="time">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
     
      </div>
      {/* SMALL LINE CHART */}
      <div className="small-chart-box">
        <h3>City Wise Inquiry Summary</h3>
        <div className="chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      </div>

      
    </div>
  );
}
