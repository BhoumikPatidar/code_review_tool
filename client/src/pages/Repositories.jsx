// import React, { useEffect, useState } from "react";
// import api from "../utils/api";

// function Repositories() {
//   const [repositories, setRepositories] = useState([]);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchRepositories = async () => {
//       try {
//         const { data } = await api.get("/repos");
//         setRepositories(data.repositories);
//       } catch (err) {
//         console.error("Error fetching repositories:", err);
//         setError("Failed to fetch repositories");
//       }
//     };

//     fetchRepositories();
//   }, []);

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Repositories</h2>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <ul>
//         {repositories.map((repo) => (
//           <li key={repo.name}>{repo.name}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default Repositories;



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const { data } = await api.get("/repos");
        setRepositories(data.repositories || []);
      } catch (err) {
        console.error("Error fetching repositories:", err);
        setError("Failed to fetch repositories");
      }
    };

    fetchRepositories();
  }, []);

  const handleRepoClick = (repoName) => {
    navigate(`/explore/${repoName}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repositories</h2>
      {repositories.map((repo) => (
        <button
          key={repo.name}
          onClick={() => handleRepoClick(repo.name)}
          style={{
            padding: "10px",
            textAlign: "left",
            cursor: "pointer",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            width: "fit-content",
            marginBottom: "10px"
          }}
        >
          📁 {repo.name}
        </button>
      ))}
    </div>
  );
}

// Add this default export
export default Repositories;