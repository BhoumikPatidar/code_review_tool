// import React, { useEffect, useState } from "react";
// import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
// import api from "../utils/api";

// function RepoExplorer() {
//   const { repoName } = useParams();
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const currentPath = searchParams.get("path") || "";
//   const [tree, setTree] = useState({ path: currentPath, entries: [] });
//   const [error, setError] = useState("");

//   const fetchTree = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/tree`, {
//         params: { path: currentPath }
//       });
//       setTree(data);
//       setError("");
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.error || "Error fetching repository contents");
//     }
//   };

//   useEffect(() => {
//     fetchTree();
//   }, [repoName, currentPath]);

//   const renderBreadcrumbs = () => {
//     const parts = currentPath.split("/").filter(Boolean);
//     const crumbs = [{ label: "Root", path: "" }];
//     let accum = "";
//     parts.forEach(part => {
//       accum += "/" + part;
//       crumbs.push({ label: part, path: accum.slice(1) });
//     });
//     return (
//       <div style={{ marginBottom: "20px" }}>
//         {crumbs.map((crumb, idx) => (
//           <span key={idx}>
//             {idx > 0 && " / "}
//             <Link 
//               to={`/explore/${repoName}?path=${crumb.path}`}
//               style={{ color: "#0366d6" }}
//             >
//               {crumb.label}
//             </Link>
//           </span>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Repository: {repoName}</h2>
//       {renderBreadcrumbs()}
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//         {tree.entries.map((entry, index) => (
//           <button
//             key={index}
//             onClick={() => {
//               if (entry.type === "directory") {
//                 navigate(`/explore/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//               } else {
//                 navigate(`/view/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//               }
//             }}
//             style={{
//               padding: "8px 16px",
//               textAlign: "left",
//               cursor: "pointer",
//               backgroundColor: "#f6f8fa",
//               border: "1px solid #d1d5da",
//               borderRadius: "6px",
//               width: "fit-content",
//               display: "flex",
//               alignItems: "center",
//               gap: "8px"
//             }}
//           >
//             {entry.type === "directory" ? "📁" : "📄"} {entry.name}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default RepoExplorer;







import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

function RepoExplorer() {
  const { repoName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentPath = searchParams.get("path") || "";
  const currentBranch = searchParams.get("branch") || "main";
  const [tree, setTree] = useState({ path: currentPath, entries: [] });
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");

  const fetchBranches = async () => {
    try {
      const { data } = await api.get(`/repos/${repoName}/branches`);
      setBranches(data.branches || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError(err.response?.data?.error || "Error fetching branches");
    }
  };

  const fetchTree = async () => {
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
      console.error(err);
      setError(err.response?.data?.error || "Error fetching repository contents");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [repoName]);

  useEffect(() => {
    fetchTree();
  }, [repoName, currentPath, currentBranch]);

  const handleBranchChange = (event) => {
    setSearchParams({ 
      path: currentPath,
      branch: event.target.value
    });
  };

  const renderBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ label: "Root", path: "" }];
    let accum = "";
    parts.forEach(part => {
      accum += "/" + part;
      crumbs.push({ label: part, path: accum.slice(1) });
    });
    return (
      <div style={{ marginBottom: "20px" }}>
        {crumbs.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && " / "}
            <Link 
              to={`/explore/${repoName}?path=${crumb.path}`}
              style={{ color: "#0366d6" }}
            >
              {crumb.label}
            </Link>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Repository: {repoName}</h2>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <label htmlFor="branch-select">Branch:</label>
        <select 
          id="branch-select"
          value={currentBranch}
          onChange={handleBranchChange}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #d1d5da"
          }}
        >
          {branches.map(branch => (
            <option 
              key={branch.name} 
              value={branch.name}
            >
              {branch.name} {branch.isHead ? "(HEAD)" : ""}
            </option>
          ))}
        </select>
      </div>
      {renderBreadcrumbs()}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tree.entries.map((entry, index) => (
          <button
            key={index}
            onClick={() => {
              if (entry.type === "directory") {
                navigate(`/explore/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
              } else {
                navigate(`/view/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
              }
            }}
            style={{
              padding: "8px 16px",
              textAlign: "left",
              cursor: "pointer",
              backgroundColor: "#f6f8fa",
              border: "1px solid #d1d5da",
              borderRadius: "6px",
              width: "fit-content",
              display: "flex",
              alignItems: "center",
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