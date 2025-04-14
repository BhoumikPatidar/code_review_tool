// src/App.jsx
import { Routes, Route } from "react-router-dom";
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

// New repository-related imports
import RepositoryDashboard from "./pages/RepositoryDashboard";
import CreateRepository from "./pages/CreateRepository";
import RepositorySettings from "./pages/RepositorySettings";

function App() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  console.log(token);
  console.log(user);

  return (
    <div style={{ width: "100%" }}>
      {token && user && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prs" element={<PRDashboard />} />
        <Route path="/prs/:id" element={<PRDetail />} />
        
        {/* Legacy repository routes - can be removed later */}
        <Route path="/repositories" element={<RepositoryManagement />} />
        
        {/* New repository routes */}
        <Route path="/repos" element={<RepositoryDashboard />} />
        <Route path="/repos/new" element={<CreateRepository />} />
        <Route path="/repos/:repoId/settings" element={<RepositorySettings />} />
        
        <Route path="/sshkey" element={<SshKeyUpdate />} />
        <Route path="/explore/:repoName" element={<RepoExplorer />} />
        <Route path="/view/:repoName" element={<FileViewer />} />
      </Routes>
    </div>
  );
}

export default App;