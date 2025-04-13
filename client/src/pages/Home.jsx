import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Importing a CSS file for styling

function Home() {
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