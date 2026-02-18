import { useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [projectRes, inquiryRes] = await Promise.all([
        api.get("/lily/count"),
        api.get("/contact"),
      ]);

      setTotalProjects(projectRes?.data?.totalProjects || 0);

      // 📆 Show only inquiries from last 7 days (1 week)
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

    // 🔁 auto refresh every 30 seconds
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

      {/* 🔔 LAST WEEK INQUIRIES */}
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
    </div>
  );
}
