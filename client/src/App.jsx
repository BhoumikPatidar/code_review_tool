// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PRDashboard from './pages/PRDashboard';  // Import the new page


function App() {
  return (
    <div style={{ width: '100%' }}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/prs" element={<PRDashboard />} /> {/* New route for PR dashboard */}
      </Routes>
    </div>
  );
}

export default App;
