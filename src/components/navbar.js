import { useState } from "react";
import "./navbar.css";
import { FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Dummy admin data (replace later from API)
  const admin = {
    name: "Admin User",
    mobile: "+91 9876543210",
    email: "admin@gmail.com",
  };

  return (
    <div className="navbar">
      <div className="navbar-title">Real Estate Management</div>

      <div className="admin-section">
        <div className="admin-logo" onClick={() => setOpen(!open)}>
            <FaUserCircle size={32} />

        </div>

        {open && (
          <div className="admin-dropdown">
            <p><strong>{admin.name}</strong></p>
            <p>{admin.mobile}</p>
            <p>{admin.email}</p>
            <hr />
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("isAdmin");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
