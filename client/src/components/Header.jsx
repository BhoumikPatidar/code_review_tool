// src/components/Header.jsx
import { Link } from "react-router-dom";

function Header() {
  // const navigate = useNavigate();
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
        background: "darkgray",
      }}
    >
      <h2>Code Review Tool</h2>
      <nav>
        {/* <Link to="/dashboard" style={{ marginRight: "1rem" }}>
          Dashboard
        </Link> */}
        <Link to="/prs" style={{ marginRight: "1rem" }}>
          Pull Requests
        </Link>
        <Link to="/repositories" style={{ marginRight: "1rem" }}>
          Repositories
        </Link>
        <Link to="/sshkey" style={{ marginRight: "1rem" }}>
          SSH Key
        </Link>
        {user && (
          <span>
            Welcome, {user.username}
            <button onClick={handleLogout} style={{ marginLeft: "1rem" }}>
              Logout
            </button>
          </span>
        )}
      </nav>
    </header>
  );
}

export default Header;
