import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { TextField } from "@mui/material";

function RepositoryManagement() {
  const [repoName, setRepoName] = useState("");
  const [repos, setRepos] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch repositories using the backend endpoint
  const fetchRepos = async () => {
    try {
      const { data } = await api.get("/repos");
      setRepos(data.repositories || []);
      setMessage(""); 
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setMessage(error.response?.data?.error || "Error fetching repositories");
      setRepos([]);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // Handle form submission to create a new repository
  const handleCreateRepo = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/repos/create", { name: repoName });
      setMessage(data.message);
      setRepoName("");
      fetchRepos();
    } catch (error) {
      console.error("Error creating repository:", error);
      setMessage(error.response?.data?.error || "Error creating repository");
    }
  };

  // Navigate to repository contents
  const handleRepoClick = (repoName) => {
    navigate(`/explore/${repoName}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repository Management</h2>
      {message && <p style={{ color: message.includes("Error") ? "red" : "green" }}>{message}</p>}
      
      <form onSubmit={handleCreateRepo}>
        <TextField
          type="text"
          label="Enter repository name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          required
          style={{ marginRight: "0.5rem" }}
        />
        <br />
        <br />
        <button type="submit">Create Repository</button>
      </form>

      <h3>Existing Repositories</h3>
      {repos.length === 0 ? (
        <p>No repositories available</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {repos.map((repo, index) => (
            <button
              key={index}
              onClick={() => handleRepoClick(repo.name)}
              style={{
                padding: "10px",
                textAlign: "left",
                cursor: "pointer",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "fit-content"
              }}
            >
              📁 {repo.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RepositoryManagement;