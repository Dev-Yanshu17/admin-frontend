import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";

import Dashboard from "./Pages/Dashboard";
import Projects from "./Pages/Projects";
import Houses from "./Pages/House";          // Bookings page
import Services from "./Pages/Services";
import Login from "./Pages/Login";
import BookingHistory from "./Pages/BookingHistory"; // ✅ ADD THIS

import "./styles.css";

function Layout() {
  const location = useLocation();

  /* ================= LOGIN PAGE ================= */
  const isLoginPage = location.pathname === "/";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    );
  }

  /* ================= MAIN LAYOUT ================= */
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/bookings" element={<Houses />} />
          <Route path="/services" element={<Services />} />

          {/* ✅ BOOKING HISTORY ROUTE */}
          <Route
            path="/booking-history/:bookingId"
            element={<BookingHistory />}
          />
        </Routes>
      </div>
    </div>
  );
}

/* ================= APP ROOT ================= */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
