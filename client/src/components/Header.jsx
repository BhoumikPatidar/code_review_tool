// src/components/Header.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { currentUser, logout, loading } = useAuth();

  // Improved logout handler that uses the AuthContext logout function
  const handleLogout = (e) => {
    e.preventDefault(); // Prevent any default behavior
    if (window.confirm("Are you sure you want to log out?")) {
      logout(); // This should use the AuthContext logout function
    }
  };

  // Don't show header when loading or not authenticated
  if (loading || !currentUser) {
    return null;
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "darkgray",
      }}
    >
      <h2>Code Review Tool</h2>
      <nav>
        <Link to="/prs" style={{ marginRight: "1rem" }}>
          Pull Requests
        </Link>
        <Link to="/repositories" style={{ marginRight: "1rem" }}>
          Repositories
        </Link>
        <Link to="/sshkey" style={{ marginRight: "1rem" }}>
          SSH Key
        </Link>
        <Link to="/permissions" style={{ marginRight: "1rem" }}>
          Manage Permissions
        </Link> {/* Added Manage Permissions link */}
        <span>
          Welcome, {currentUser.username}
          <button 
            onClick={handleLogout} 
            style={{ 
              marginLeft: "1rem",
              backgroundColor: "#f44336",
              color: "white"
            }}
          >
            Logout
          </button>
        </span>
      </nav>
    </header>
  );
}

export default Header;