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
    const fetchData = async () => {
      setLoading(true);
      try {
        // First try to get branches
        const branchesResponse = await api.get(`/repos/${repoName}/branches`);
        const branchesData = branchesResponse.data.branches;
        setBranches(branchesData);

        // If we got branches, use the first one or HEAD if no branch was specified
        if (!currentBranch && branchesData.length > 0) {
          const defaultBranch = branchesData.find(b => b.isHead)?.name || branchesData[0].name;
          setCurrentBranch(defaultBranch);
        }

        // Get tree contents
        const { data } = await api.get(`/repos/${repoName}/tree`, {
          params: { 
            path: currentPath,
            branch: currentBranch || 'main'
          }
        });
        setTree(data);
        setError("");
      } catch (err) {
        console.error("Error:", err);
        setError(err.response?.data?.error || "Failed to load repository contents");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoName, currentPath, currentBranch]);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Loading repository contents...</h2>
      </div>
    );
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