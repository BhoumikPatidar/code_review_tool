import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  return (
    <nav style={{ padding: "1rem", backgroundColor: "#f6f8fa", borderBottom: "1px solid #d1d5da" }}>
      <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
      <Link to="/dashboard" style={{ marginRight: "1rem" }}>Dashboard</Link>
      <Link to="/repositories" style={{ marginRight: "1rem" }}>Repositories</Link>
      {user?.username === "admin" && (
        <Link to="/permissions" style={{ marginRight: "1rem" }}>Manage Permissions</Link>
      )}
      <Link to="/sshkey">SSH Key</Link>
    </nav>
  );
}

export default Navbar;