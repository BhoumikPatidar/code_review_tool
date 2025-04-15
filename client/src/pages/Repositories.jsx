import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const { data } = await api.get("/repos");
        setRepositories(data.repositories);
      } catch (err) {
        console.error("Error fetching repositories:", err);
        setError("Failed to fetch repositories");
      }
    };

    fetchRepositories();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repositories</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {repositories.map((repo) => (
          <li key={repo.name}>{repo.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Repositories;