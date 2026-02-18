import { useEffect, useState } from "react";
import api from "../api";
import "./Inquiry.css";

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

export default function Inquiry() {
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

        // 🔵 BLUE LINE STYLING
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

  return (
    <div className="inquiry-page">
      <h1>Project Inquiries</h1>

      {/* TABLE */}
      <div className="inquiry-table-box">
        <table>
          <thead>
            <tr>
              <th>Sr.no</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((item, i) => (
              <tr key={item._id}>
                <td>{i + 1}</td>
                <td>{item.firstName}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>{item.location}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SMALL LINE CHART */}
      <div className="small-chart-box">
        <h3>City Wise Inquiry Summary</h3>
        <div className="chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
