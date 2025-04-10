// src/pages/RepositoryManagement.jsx
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { TextField } from "@mui/material";

function RepositoryManagement() {
  const [repoName, setRepoName] = useState("");
  const [repos, setRepos] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch repositories using the backend endpoint
  const fetchRepos = async () => {
    try {
      const { data } = await api.get("/repos");
      setRepos(data.repositories || []);
      setMessage(""); // Clear any previous error messages
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setMessage(error.response?.data?.error || "Error fetching repositories");
      setRepos([]); // Reset repos on error
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
      fetchRepos(); // Refresh repository list
    } catch (error) {
      console.error("Error creating repository:", error);
      setMessage(error.response?.data?.error || "Error creating repository");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repository Management</h2>
      {message && <p>{message}</p>}
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
        <ul>
          {repos.map((repo, index) => (
            <li key={index}>{repo.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RepositoryManagement;
