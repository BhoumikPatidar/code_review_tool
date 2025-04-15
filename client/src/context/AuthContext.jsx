import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth available
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // On mount, check if user is logged in
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Update api authorization header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      // Handle debug login
      if (username === "admin" && password === "debug") {
        const debugUser = { username: "admin", role: "developer" };
        const debugToken = "dummy_token";
        
        setToken(debugToken);
        setCurrentUser(debugUser);
        
        localStorage.setItem("token", debugToken);
        localStorage.setItem("user", JSON.stringify(debugUser));
        
        setLoading(false);
        return { success: true };
      }
      
      // Regular login through API
      const { data } = await api.post("/auth/login", { username, password });
      
      setToken(data.token);
      setCurrentUser(data.user);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  // Register function
  const register = async (username, password, publicKey) => {
    try {
      setLoading(true);
      const { data } = await api.post("/auth/register", { username, password, publicKey });
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  };

  // Logout function that redirects to home page
  const logout = () => {
    // Start with state updates
    setToken(null);
    setCurrentUser(null);
    
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear any authentication headers
    delete api.defaults.headers.common['Authorization'];
    
    // Force a brief loading state to ensure components are properly updated
    setLoading(true);
    
    // Small timeout to ensure state updates have propagated
    setTimeout(() => {
      setLoading(false);
      // Navigate to home page
      navigate("/", { replace: true });
    }, 100);
  };

  // Context value
  const value = {
    currentUser,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <LoadingSpinner />}
    </AuthContext.Provider>
  );
};