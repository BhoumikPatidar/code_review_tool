// src/pages/PRDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Paper,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Table,
  TableBody,
} from "@mui/material";

function PRDashboard() {
  const [prs, setPRs] = useState([]);
  const [formData, setFormData] = useState({
    repository: "",
    sourceBranch: "",
    targetBranch: "",
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [mergeError, setMergeError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const checkMergePermissions = async (repository) => {
    try {
      console.log("Checking merge permissions for repository:", repository);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No auth token found");
        return false;
      }
      console.log(1);
      // Get user permissions
      const response = await api.get('/permissions/user');
      console.log(2);
      console.log("Permissions response:", response.data);
  
      const { repositories } = response.data;
      
      // Find repository permissions
      const repoPermissions = repositories.find(repo => repo.name === repository);
      console.log("Repository permissions:", repoPermissions);
  
      // Check for RW+ permission
      const hasPermission = repoPermissions?.permissions?.includes('RW+');
      console.log(`Has RW+ permission for ${repository}: ${hasPermission}`);
  
      return hasPermission || false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      console.error('Error details:', error.response?.data || error.message);
      return false;
    }
  };
  
  const handleMerge = async (id) => {
    try {
      setMergeError("");
      
      // Get PR details first - Remove '/api' prefix
      const { data: pr } = await api.get(`/prs/${id}`);
      console.log("PR details:", pr);
      
      // Check permissions
      const hasPermission = await checkMergePermissions(pr.repository);
      if (!hasPermission) {
        setMergeError("You don't have the required permissions (RW+) to merge this PR");
        return;
      }
  
      // Attempt merge - Remove '/api' prefix
      const response = await api.post(`/prs/${id}/merge`);
      console.log("Merge response:", response.data);
  
      if (response.data.status === 'merged') {
        setMessage("PR merged successfully!");
        fetchPRs(); // Refresh the list
      }
    } catch (error) {
      console.error("Error merging PR:", error);
      if (error.response?.status === 409) {
        navigate(`/prs/${id}/conflicts`, { 
          state: { conflicts: error.response.data.conflicts }
        });
      } else {
        setMergeError(error.response?.data?.error || "Error merging PR");
      }
    }
  };
  // Fetch all PRs from backend
  const fetchPRs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/prs");
      setPRs(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching PRs:", error);
      setMessage("Error fetching PRs");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Create a new PR
  const handleCreatePR = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api.post("/prs/create", formData);
      setMessage("PR created successfully!");
      setFormData({
        repository: "",
        sourceBranch: "",
        targetBranch: "",
        title: "",
        description: "",
      });
      fetchPRs();
    } catch (error) {
      console.error("Error creating PR:", error);
      setMessage(error.response?.data?.error || "Error creating PR");
    }
    setLoading(false);
  };

  // Approve a PR
  const handleApprove = async (id) => {
    try {
      await api.post(`/prs/${id}/approve`);
      setMessage("PR approved!");
      fetchPRs();
    } catch (error) {
      console.error("Error approving PR:", error);
      setMessage("Error approving PR");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Pull Request Dashboard</h2>
      {/* {message && <p>{message}</p>} */}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {mergeError && <p style={{ color: 'red' }}>{mergeError}</p>}

      <h3>Create New PR</h3>
      <form onSubmit={handleCreatePR} style={{ marginBottom: "2rem" }}>
        <TextField
          // type="text"
          name="repository"
          label="Repository (e.g., trial)"
          value={formData.repository}
          onChange={handleChange}
          required
          style={{ marginRight: "0.5rem" }}
        />
        <TextField
          // type="text"
          name="sourceBranch"
          // placeholder="Source Branch (e.g., feature-add-login)"
          label="Source Branch"
          value={formData.sourceBranch}
          onChange={handleChange}
          required
          style={{ marginRight: "0.5rem" }}
        />
        <TextField
          // type="text"
          name="targetBranch"
          label="Target Branch"
          value={formData.targetBranch}
          onChange={handleChange}
          required
          style={{ marginRight: "0.5rem" }}
        />
        <TextField
          // type="text"
          name="title"
          label="PR Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ marginRight: "0.5rem" }}
        />
        <br />
        <br />
        <TextField
          multiline
          name="description"
          label="PR Description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          style={{ marginBottom: "0.5rem", width: "30%" }}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create PR"}
        </button>
      </form>

      <h3>Existing PRs</h3>
      {prs.length === 0 ? (
        <p>No pull requests available.</p>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Repository</TableCell>
                  <TableCell>Source Branch</TableCell>
                  <TableCell>Target Branch</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell>{pr.id}</TableCell>
                    <TableCell>{pr.repository}</TableCell>
                    <TableCell>{pr.sourceBranch}</TableCell>
                    <TableCell>{pr.targetBranch}</TableCell>
                    <TableCell>{pr.title}</TableCell>
                    <TableCell>{pr.status}</TableCell>
                    <TableCell>
                      {pr.status === "open" && (
                        <button onClick={() => handleApprove(pr.id)}>
                          Approve
                        </button>
                      )}
                      {pr.status === "approved" && (
                        <button onClick={() => handleMerge(pr.id)}>
                          Merge
                        </button>
                      )}
                      {pr.status === "merged" && <span>Merged</span>}
                    </TableCell>
                    <TableCell>
                      <Link to={`/prs/${pr.id}`}>View Details</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* <table border="1" cellPadding="8" style={{ margin: "0 auto" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Repository</th>
                <th>Source Branch</th>
                <th>Target Branch</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr key={pr.id}>
                  <td>{pr.id}</td>
                  <td>{pr.repository}</td>
                  <td>{pr.sourceBranch}</td>
                  <td>{pr.targetBranch}</td>
                  <td>{pr.title}</td>
                  <td>{pr.status}</td>
                  <td>
                    {pr.status === "open" && (
                      <button onClick={() => handleApprove(pr.id)}>
                        Approve
                      </button>
                    )}
                    {pr.status === "approved" && (
                      <button onClick={() => handleMerge(pr.id)}>Merge</button>
                    )}
                    {pr.status === "merged" && <span>Merged</span>}
                  </td>
                  <td>
                    <Link to={`/prs/${pr.id}`}>View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> */}
        </>
      )}
      {/* <table style={{ width: "100%", marginTop: "2rem" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Repository</th>
            <th>Source Branch</th>
            <th>Target Branch</th>
            <th>Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prs.map((pr) => (
            <tr key={pr.id}>
              <td>{pr.id}</td>
              <td>{pr.repository}</td>
              <td>{pr.sourceBranch}</td>
              <td>{pr.targetBranch}</td>
              <td>{pr.title}</td>
              <td>{pr.status}</td>
              <td>
                {pr.status === 'open' && (
                  <button onClick={() => handleApprove(pr.id)}>
                    Approve
                  </button>
                )}
                {pr.status === 'approved' && (
                  <button 
                    onClick={() => handleMerge(pr.id)}
                    style={{ 
                      backgroundColor: "#238636",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Merge
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
}

export default PRDashboard;
