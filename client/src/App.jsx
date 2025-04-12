// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import PRDashboard from "./pages/PRDashboard"; // Import the new page
import RepositoryManagement from "./pages/RepositoryManagement"; // New import
import PRDetail from "./pages/PRDetail"; // Import the new detailed PR view
import SshKeyUpdate from "./pages/SshKeyUpdate"; // New import
import RepoExplorer from "./pages/RepoExplorer";
import FileViewer from "./pages/FileViewer";

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
        <Route path="/repositories" element={<RepositoryManagement />} />
        <Route path="/sshkey" element={<SshKeyUpdate />} />
        <Route path="/explore/:repoName" element={<RepoExplorer />} />
        <Route path="/view/:repoName" element={<FileViewer />} />
      </Routes>
    </div>
  );
}

export default App;
