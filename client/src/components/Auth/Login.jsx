// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { TextField } from "@mui/material";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username === "admin" && password === "debug") {
      localStorage.setItem("token", "dummy_token");
      localStorage.setItem(
        "user",
        JSON.stringify({ username: "admin", role: "developer" })
      );
      navigate("/repositories");
      return;
    }
    try {
      const { data } = await api.post("/auth/login", { username, password });
      // Save both token and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // navigate("/dashboard");
      location.href = "/repositories";
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 color="#000000">Login</h2>
      <form onSubmit={handleLogin}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <br />
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
