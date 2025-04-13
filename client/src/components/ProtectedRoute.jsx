import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to home instead of login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;