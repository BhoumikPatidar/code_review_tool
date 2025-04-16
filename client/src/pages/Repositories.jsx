// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../utils/api';
// import { useAuth } from '../context/AuthContext';

// function Repositories() {
//   const [repositories, setRepositories] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchRepositories = async () => {
//       try {
//         const { data } = await api.get("/repos");
//         setRepositories(data.repositories || []);
//       } catch (err) {
//         console.error("Error fetching repositories:", err);
//         setError("Failed to fetch repositories");
//       }
//     };

//     fetchRepositories();
//   }, []);

//   const handleRepoClick = (repoName) => {
//     navigate(`/explore/${repoName}`);
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Repositories</h2>
//       {repositories.map((repo) => (
//         <button
//           key={repo.name}
//           onClick={() => handleRepoClick(repo.name)}
//           style={{
//             padding: "10px",
//             textAlign: "left",
//             cursor: "pointer",
//             backgroundColor: "#f0f0f0",
//             border: "1px solid #ddd",
//             borderRadius: "4px",
//             width: "fit-content",
//             marginBottom: "10px"
//           }}
//         >
//           📁 {repo.name}
//         </button>
//       ))}
//     </div>
//   );
// }

// // Add this default export
// export default Repositories;





import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TextField } from "@mui/material";

function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [repoName, setRepoName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchRepositories = async () => {
    try {
      const { data } = await api.get("/repos");
      setRepositories(data.repositories || []);
      setError("");
    } catch (err) {
      console.error("Error fetching repositories:", err);
      setError("Failed to fetch repositories");
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleRepoClick = (repoName) => {
    navigate(`/explore/${repoName}`);
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/repos/create", { name: repoName });
      setMessage(data.message);
      setRepoName("");
      fetchRepositories(); // Refresh the list
    } catch (error) {
      console.error("Error creating repository:", error);
      setMessage(error.response?.data?.error || "Error creating repository");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repositories</h2>
      
      {/* Create Repository Form */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>Create New Repository</h3>
        {message && (
          <p style={{ color: message.includes("Error") ? "red" : "green" }}>
            {message}
          </p>
        )}
        <form onSubmit={handleCreateRepo} style={{ marginBottom: "1rem" }}>
          <TextField
            type="text"
            label="Enter repository name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            required
            style={{ marginRight: "0.5rem" }}
          />
          <button 
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#2ea44f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginLeft: "10px"
            }}
          >
            Create Repository
          </button>
        </form>
      </div>

      {/* Repository List */}
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3>Available Repositories</h3>
          {repositories.map((repo) => (
            <button
              key={repo.name}
              onClick={() => handleRepoClick(repo.name)}
              style={{
                padding: "10px",
                textAlign: "left",
                cursor: "pointer",
                backgroundColor: "#f6f8fa",
                border: "1px solid #d1d5da",
                borderRadius: "4px",
                width: "fit-content",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
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

export default Repositories;