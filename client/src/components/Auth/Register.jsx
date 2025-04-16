import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [publicKey, setPublicKey] = useState(""); // New state for SSH key
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  const from = location.state?.from || "/repositories";
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await register(username, password, publicKey);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error registering user:", err);
      setError("Failed to register user");
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleRegister} className="auth-form">
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
        <textarea
          placeholder="Enter your SSH public key"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          required
          style={{ height: "100px" }}
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;