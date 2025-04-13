import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to repositories if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/repositories', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Don't show login options if loading or already authenticated
  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <div className="home-container">
      {/* Logo */}
      <img src="/logo2.png" alt="CodeCove Logo" className="home-logo" />

      {/* Tagline and Description */}
      <h1 className="home-tagline">Welcome to CodeCove</h1>
      <p className="home-description">
        Streamline your code reviews and collaborate effortlessly.
      </p>

      {/* Buttons */}
      <div className="home-buttons">
        <Link to="/login" className="btn btn-primary">Login</Link>
        <Link to="/register" className="btn btn-secondary">Register</Link>
      </div>
    </div>
  );
}

export default Home;