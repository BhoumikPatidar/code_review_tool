// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  // Retrieve user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); // Navigate to home or login page
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f5f5f5' }}>
      <h2>Code Review Tool</h2>
      {user && (
        <div>
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>Logout</button>
        </div>
      )}
    </header>
  );
}

export default Header;
