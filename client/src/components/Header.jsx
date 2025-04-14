// src/components/Header.jsx
import { Link } from "react-router-dom";

function Header() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.href = "/";
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "#24292e",
        color: "white",
      }}
    >
      <h2>Code Review Tool</h2>
      <nav style={{ display: "flex", alignItems: "center" }}>
        <Link to="/repos" style={{
          marginRight: "1rem",
          color: "white",
          textDecoration: "none",
          padding: "6px 12px",
          borderRadius: "4px",
          backgroundColor: "#2da44e"
        }}>
          Repositories
        </Link>
        <Link to="/prs" style={{ 
          marginRight: "1rem",
          color: "white",
          textDecoration: "none"
        }}>
          Pull Requests
        </Link>
        <Link to="/sshkey" style={{ 
          marginRight: "1rem",
          color: "white", 
          textDecoration: "none"
        }}>
          SSH Key
        </Link>
        {user && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "1rem" }}>
              Welcome, {user.username}
            </span>
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: "6px 12px",
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;