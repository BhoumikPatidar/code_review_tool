// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f5f5f5' }}>
      <h2>Code Review Tool</h2>
      <nav>
        <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/prs" style={{ marginRight: '1rem' }}>Pull Requests</Link>
        {user && (
          <span>
            Welcome, {user.username} 
            <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>Logout</button>
          </span>
        )}
      </nav>
    </header>
  );
}

export default Header;
