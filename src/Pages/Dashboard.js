import { useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";


export default function Dashboard() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [houseCount, setHouseCount] = useState({
    available: 0,
    booked: 0,
    sold: 0,
  });
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectRes, houseRes] = await Promise.all([
          api.get("/lily/count"),
          // api.get("/houses/status-count"),
        ]);

        setTotalProjects(projectRes?.data?.totalProjects || 0);
        setHouseCount(houseRes?.data?.data || {});
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

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
    </div>
  );
}
