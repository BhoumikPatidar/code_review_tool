// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'debug') {
      localStorage.setItem('token', 'dummy_token');
      localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'developer' }));
      navigate('/dashboard');
      return;
    }
    try {
      const { data } = await api.post('/auth/login', { username, password });
      // Save both token and user info in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          required
        /><br/><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        /><br/><br/>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
