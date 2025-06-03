import React from "react";
import { NavLink } from "react-router-dom";
// If your logo is stored in your project's assets folder:
import GRRLogo from "../GRR_logo.png"; // Adjust the path as necessary
// Otherwise, if it's in the public folder you can reference it directly.

function Header() {
  return (
    <nav style={{ background: "#1976d2", padding: "1rem 2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo on the left */}
        <div>
          <img
            src={GRRLogo} // Use the imported logo
            alt="GRR Logo"
            style={{ height: "25px", width: "auto" }}
          />
        </div>

        {/* Navigation Links on the right */}
        <div style={{ display: "flex", gap: "2rem" }}>
          <NavLink
            to="/home"
            style={({ isActive }) => ({
              color: isActive ? "#fff" : "#bbdefb",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderBottom: isActive ? "2px solid #fff" : "none",
              paddingBottom: 4,
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/new"
            style={({ isActive }) => ({
              color: isActive ? "#fff" : "#bbdefb",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderBottom: isActive ? "2px solid #fff" : "none",
              paddingBottom: 4,
            })}
          >
            New
          </NavLink>
          <NavLink
            to="/update"
            style={({ isActive }) => ({
              color: isActive ? "#fff" : "#bbdefb",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderBottom: isActive ? "2px solid #fff" : "none",
              paddingBottom: 4,
            })}
          >
            Update
          </NavLink>
          <NavLink
            to="/delete"
            style={({ isActive }) => ({
              color: isActive ? "#fff" : "#bbdefb",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderBottom: isActive ? "2px solid #fff" : "none",
              paddingBottom: 4,
            })}
          >
            Delete
          </NavLink>
          <NavLink
            to="/report"
            style={({ isActive }) => ({
              color: isActive ? "#fff" : "#bbdefb",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderBottom: isActive ? "2px solid #fff" : "none",
              paddingBottom: 4,
            })}
          >
            Report
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Header;
