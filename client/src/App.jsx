// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import PRDashboard from "./pages/PRDashboard";
import RepositoryManagement from "./pages/RepositoryManagement";
import PRDetail from "./pages/PRDetail";
import SshKeyUpdate from "./pages/SshKeyUpdate";
import RepoExplorer from "./pages/RepoExplorer";
import FileViewer from "./pages/FileViewer";
import LoadingSpinner from "./context/LoadingSpinner";
import { useEffect } from "react";
import Permissions from "./pages/Permissions";
import Navbar from "./components/NavBar";
import Repositories from "./pages/Repositories";

// Component to handle header rendering based on auth
function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Log navigation for debugging purposes
  useEffect(() => {
    console.log(`Navigated to: ${location.pathname}`);
    console.log(`Auth status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
  }, [location, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ width: "100%" }}>
      {/* {isAuthenticated && <Navbar />} */}
      {isAuthenticated && <Header />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/repositories" element={<Repositories />} />
        <Route path="/explore/:repoName" element={<RepoExplorer />} />
        <Route path="/view/:repoName" element={<FileViewer />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/permissions" 
          element={
            <ProtectedRoute>
              <Permissions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prs" 
          element={
            <ProtectedRoute>
              <PRDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prs/:id" 
          element={
            <ProtectedRoute>
              <PRDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repositories" 
          element={
            <ProtectedRoute>
              <Repositories />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repositories" 
          element={
            <ProtectedRoute>
              <RepositoryManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sshkey" 
          element={
            <ProtectedRoute>
              <SshKeyUpdate />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/explore/:repoName" 
          element={
            <ProtectedRoute>
              <RepoExplorer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/view/:repoName" 
          element={
            <ProtectedRoute>
              <FileViewer />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Route 
        path="/prs/:id/conflicts" 
        element={
          <ProtectedRoute>
            <PRConflicts />
          </ProtectedRoute>
        } 
      />
    </div>
  );
}

// // Main App component with AuthProvider
// function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;