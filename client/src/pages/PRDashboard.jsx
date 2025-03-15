// src/pages/PRDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function PRDashboard() {
  const [prs, setPRs] = useState([]);
  const [formData, setFormData] = useState({
    repository: '',
    sourceBranch: '',
    targetBranch: '',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all PRs from backend
  const fetchPRs = async () => {
    try {
      const { data } = await api.get('/prs');
      setPRs(data);
    } catch (error) {
      console.error("Error fetching PRs:", error);
      setMessage("Error fetching PRs");
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
    setMessage('');
    try {
      await api.post('/prs/create', formData);
      setMessage("PR created successfully!");
      setFormData({ repository: '', sourceBranch: '', targetBranch: '', title: '', description: '' });
      fetchPRs();
    } catch (error) {
      console.error("Error creating PR:", error);
      setMessage("Error creating PR");
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
    <div style={{ padding: '2rem' }}>
      <h2>Pull Request Dashboard</h2>
      {message && <p>{message}</p>}
      
      <h3>Create New PR</h3>
      <form onSubmit={handleCreatePR} style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          name="repository"
          placeholder="Repository (e.g., trial2.git)"
          value={formData.repository}
          onChange={handleChange}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="text"
          name="sourceBranch"
          placeholder="Source Branch (e.g., feature-add-login)"
          value={formData.sourceBranch}
          onChange={handleChange}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="text"
          name="targetBranch"
          placeholder="Target Branch (e.g., main)"
          value={formData.targetBranch}
          onChange={handleChange}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="text"
          name="title"
          placeholder="PR Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <br /><br />
        <textarea
          name="description"
          placeholder="PR Description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          cols={50}
          style={{ marginBottom: '0.5rem' }}
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
        <table border="1" cellPadding="8" style={{ margin: '0 auto' }}>
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
                    <button onClick={() => handleApprove(pr.id)}>Approve</button>
                  )}
                  {pr.status === 'approved' && (
                    <button onClick={() => handleMerge(pr.id)}>Merge</button>
                  )}
                  {pr.status === 'merged' && (
                    <span>Merged</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PRDashboard;
