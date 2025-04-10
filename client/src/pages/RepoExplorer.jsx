import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

function RepoExplorer() {
  const { repoName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentPath = searchParams.get("path") || "";
  const [tree, setTree] = useState({ path: currentPath, entries: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(searchParams.get("branch") || "main");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get(`/repos/${repoName}/branches`);
        console.log("Branches response:", response.data);
        setBranches(response.data.branches || []);
        
        // Set default branch if none selected
        if (!currentBranch && response.data.branches?.length > 0) {
          const defaultBranch = response.data.branches.find(b => b.isHead)?.name || response.data.branches[0].name;
          setCurrentBranch(defaultBranch);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError("Failed to load branches");
      }
    };

    fetchBranches();
  }, [repoName]);

  // Fetch tree contents when branch changes
  useEffect(() => {
    const fetchTree = async () => {
      if (!currentBranch) return;
      
      setLoading(true);
      try {
        const { data } = await api.get(`/repos/${repoName}/tree`, {
          params: { 
            path: currentPath,
            branch: currentBranch
          }
        });
        setTree(data);
        setError("");
      } catch (err) {
        console.error("Error fetching tree:", err);
        setError(err.response?.data?.error || "Error fetching repository contents");
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [repoName, currentPath, currentBranch]);

  // Handle branch change
  const handleBranchChange = (event) => {
    const newBranch = event.target.value;
    setCurrentBranch(newBranch);
    setSearchParams({ path: currentPath, branch: newBranch });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Error</h2>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/repositories")}>
          Back to Repositories
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repository: {repoName}</h2>

      {branches.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <select
            value={currentBranch}
            onChange={(e) => setCurrentBranch(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #d1d5da"
            }}
          >
            {branches.map((branch) => (
              <option key={branch.name} value={branch.name}>
                {branch.name} {branch.isHead ? "(HEAD)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tree.entries.map((entry, index) => (
          <button
            key={index}
            onClick={() => {
              const newPath = currentPath 
                ? `${currentPath}/${entry.name}` 
                : entry.name;
              if (entry.type === "directory") {
                navigate(`/explore/${repoName}?path=${newPath}&branch=${currentBranch}`);
              } else {
                navigate(`/view/${repoName}?path=${newPath}&branch=${currentBranch}`);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              border: "1px solid #d1d5da",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
              width: "fit-content",
              gap: "8px"
            }}
          >
            {entry.type === "directory" ? "📁" : "📄"} {entry.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RepoExplorer;