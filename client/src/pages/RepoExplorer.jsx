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

  const fetchTree = async () => {
    try {
      const { data } = await api.get(`/repos/${repoName}/tree`, {
        params: { path: currentPath }
      });
      setTree(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error fetching repository contents");
    }
  };

  useEffect(() => {
    fetchTree();
  }, [repoName, currentPath]);

  // Build a "breadcrumb" navigation from the current path
  const renderBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ label: "Root", path: "" }];
    let accum = "";
    parts.forEach(part => {
      accum += "/" + part;
      crumbs.push({ label: part, path: accum.slice(1) });
    });
    return crumbs.map((crumb, idx) => (
      <span key={idx}>
        {idx > 0 && " / "}
        <Link to={`/explore/${repoName}?path=${crumb.path}`}>{crumb.label}</Link>
      </span>
    ));
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repository Explorer: {repoName}</h2>
      <div>{renderBreadcrumbs()}</div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {tree.entries.map((entry, index) => (
          <li key={index}>
            {entry.type === "directory" ? (
              <button
                onClick={() =>
                  navigate(`/explore/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`)
                }
              >
                📁 {entry.name}
              </button>
            ) : (
              <button
                onClick={() =>
                  navigate(`/view/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`)
                }
              >
                📄 {entry.name}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoExplorer;