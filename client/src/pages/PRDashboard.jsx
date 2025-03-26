// src/pages/PRDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
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

  // Merge a PR
  const handleMerge = async (id) => {
    try {
      await api.post(`/prs/${id}/merge`);
      setMessage("PR merged!");
      fetchPRs();
    } catch (error) {
      console.error("Error merging PR:", error);
      setMessage("Error merging PR");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Pull Request Dashboard</h2>
      {message && <p>{message}</p>}

      <h3>Create New PR</h3>
      <form onSubmit={handleCreatePR} style={{ marginBottom: "2rem" }}>
        <TextField
          // type="text"
          name="repository"
          label="Repository (e.g., trial2.git)"
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
    </div>
  );
}

export default PRDashboard;
