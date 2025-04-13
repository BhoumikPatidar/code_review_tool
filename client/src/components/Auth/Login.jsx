import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Get the page user was trying to access
  const from = location.state?.from || "/repositories";

  // If already authenticated, redirect to target page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password);
    
    if (result.success) {
      // Navigate to the page they were trying to access, or repositories by default
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {location.state?.from && (
        <p>Please log in to access this page</p>
      )}
      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;