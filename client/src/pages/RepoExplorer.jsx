// import React, { useEffect, useState } from "react";
// import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
// import api from "../utils/api";

// function RepoExplorer() {
//   const { repoName } = useParams();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const currentPath = searchParams.get("path") || "";
//   const currentBranch = searchParams.get("branch") || "main";
//   const [tree, setTree] = useState({ path: currentPath, entries: [] });
//   const [branches, setBranches] = useState([]);
//   const [error, setError] = useState("");
  

//   //old
//   // const fetchBranches = async () => {
//   //   try {
//   //     const { data } = await api.get(`/repos/${repoName}/branches`);
//   //     setBranches(data.branches || []);
//   //   } catch (err) {
//   //     console.error("Error fetching branches:", err);
//   //     setError(err.response?.data?.error || "Error fetching branches");
//   //   }
//   // };

//   //new
//   const fetchBranches = async () => {
//     try {
//       console.log("Fetching branches for repo:", repoName);
//       const { data } = await api.get(`/repos/${repoName}/branches`);
//       console.log("Received branches:", data.branches);
//       setBranches(data.branches || []);
//       setError("");
//     } catch (err) {
//       console.error("Error fetching branches:", err);
//       setError(err.response?.data?.error || "Error fetching branches");
//       setBranches([]);
//     }
//   };

//   const fetchTree = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/tree`, {
//         params: { 
//           path: currentPath,
//           branch: currentBranch
//         }
//       });
//       setTree(data);
//       setError("");
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.error || "Error fetching repository contents");
//     }
//   };

//   useEffect(() => {
//     fetchBranches();
//   }, [repoName]);

//   useEffect(() => {
//     fetchTree();
//   }, [repoName, currentPath, currentBranch]);

//   const handleBranchChange = (event) => {
//     setSearchParams({ 
//       path: currentPath,
//       branch: event.target.value
//     });
//   };

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
//       <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
//         <label htmlFor="branch-select">Branch:</label>
//         <select 
//           id="branch-select"
//           value={currentBranch}
//           onChange={handleBranchChange}
//           style={{
//             padding: "8px",
//             borderRadius: "4px",
//             border: "1px solid #d1d5da"
//           }}
//         >
//           {branches.map(branch => (
//             <option 
//               key={branch.name} 
//               value={branch.name}
//             >
//               {branch.name} {branch.isHead ? "(HEAD)" : ""}
//             </option>
//           ))}
//         </select>
//       </div>
//       {renderBreadcrumbs()}
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//   {tree.entries.length > 0 ? (
//     tree.entries.map((entry, index) => (
//       <button
//         key={index}
//         onClick={() => {
//           if (entry.type === "directory") {
//             navigate(`/explore/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//           } else {
//             navigate(`/view/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//           }
//         }}
//         style={{
//           padding: "8px 16px",
//           textAlign: "left",
//           cursor: "pointer",
//           backgroundColor: "#f6f8fa",
//           border: "1px solid #d1d5da",
//           borderRadius: "6px",
//           width: "fit-content",
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//         }}
//       >
//         {entry.type === "directory" ? "📁" : "📄"} {entry.name}
//       </button>
//     ))
//   ) : (
//     <p style={{ color: "#666" }}>The repository is empty or contains no supported files.</p>
//   )}
// </div>
//     </div>
//   );
// }

// export default RepoExplorer;




// import React, { useEffect, useState } from "react";
// import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
// import api from "../utils/api";

// function RepoExplorer() {
//   const { repoName } = useParams();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const currentPath = searchParams.get("path") || "";
//   const currentBranch = searchParams.get("branch") || "main";
//   const [tree, setTree] = useState({ path: currentPath, entries: [] });
//   const [branches, setBranches] = useState([]);
//   const [commits, setCommits] = useState([]);
//   const [selectedCommit1, setSelectedCommit1] = useState("");
//   const [selectedCommit2, setSelectedCommit2] = useState("");
//   const [diff, setDiff] = useState(null);
//   const [error, setError] = useState("");

//   const fetchBranches = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/branches`);
//       setBranches(data.branches || []);
//     } catch (err) {
//       console.error("Error fetching branches:", err);
//       setError("Error fetching branches");
//     }
//   };

//   const fetchCommits = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/commits`, {
//         params: { branch: currentBranch },
//       });
//       setCommits(data.commits || []);
//       if (data.commits.length > 1) {
//         setSelectedCommit1(data.commits[0].sha);
//         setSelectedCommit2(data.commits[1].sha);
//       }
//     } catch (err) {
//       console.error("Error fetching commits:", err);
//       setError("Error fetching commit history");
//     }
//   };

//   const fetchTree = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/tree`, {
//         params: { path: currentPath, branch: currentBranch },
//       });
//       setTree(data);
//     } catch (err) {
//       console.error("Error fetching repository contents:", err);
//       setError("Error fetching repository contents");
//     }
//   };

//   const fetchDiff = async () => {
//     if (selectedCommit1 && selectedCommit2) {
//       try {
//         const { data } = await api.get(`/repos/${repoName}/diff`, {
//           params: {
//             commit1: selectedCommit1,
//             commit2: selectedCommit2,
//             sourceBranch: currentBranch,
//             targetBranch: currentBranch,
//           },
//         });
//         setDiff(data.diff);
//       } catch (err) {
//         console.error("Error fetching diff:", err);
//         setError("Error fetching diff between commits");
//       }
//     }
//   };

//   useEffect(() => {
//     fetchBranches();
//     fetchCommits();
//   }, [repoName, currentBranch]);

//   useEffect(() => {
//     fetchTree();
//   }, [repoName, currentPath, currentBranch]);


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
//       <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
//         <label htmlFor="branch-select">Branch:</label>
//         <select
//           id="branch-select"
//           value={currentBranch}
//           onChange={(e) => setSearchParams({ path: currentPath, branch: e.target.value })}
//           style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5da" }}
//         >
//           {branches.map((branch) => (
//             <option key={branch.name} value={branch.name}>
//               {branch.name} {branch.isHead ? "(HEAD)" : ""}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div style={{ marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center" }}>
//         <div>
//           <label htmlFor="commit1">Base Commit:</label>
//           <select
//             id="commit1"
//             value={selectedCommit1}
//             onChange={(e) => setSelectedCommit1(e.target.value)}
//             style={{ padding: "4px", marginLeft: "8px" }}
//           >
//             {commits.map((commit) => (
//               <option key={commit.sha} value={commit.sha}>
//                 {commit.sha.substring(0, 7)} - {commit.message}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label htmlFor="commit2">Compare With:</label>
//           <select
//             id="commit2"
//             value={selectedCommit2}
//             onChange={(e) => setSelectedCommit2(e.target.value)}
//             style={{ padding: "4px", marginLeft: "8px" }}
//           >
//             {commits.map((commit) => (
//               <option key={commit.sha} value={commit.sha}>
//                 {commit.sha.substring(0, 7)} - {commit.message}
//               </option>
//             ))}
//           </select>
//         </div>

//         <button
//           onClick={fetchDiff}
//           style={{
//             padding: "8px 16px",
//             backgroundColor: "#2ea44f",
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             cursor: "pointer",
//           }}
//         >
//           Show Diff
//         </button>
//       </div>

//       {diff && (
//         <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "1rem" }}>
//           <h3>Diff Between Selected Commits</h3>
//           <pre
//             style={{
//               background: "#f6f8fa",
//               padding: "1rem",
//               borderRadius: "6px",
//               overflowX: "auto",
//             }}
//           >
//             {diff.split("\n").map((line, idx) => {
//               let color = "black";
//               if (line.startsWith("+")) color = "green";
//               if (line.startsWith("-")) color = "red";
//               return (
//                 <span key={idx} style={{ color }}>
//                   {line}
//                 </span>
//               );
//             })}
//           </pre>
//         </div>
//       )}

//       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//         {tree.entries.length > 0 ? (
//           tree.entries.map((entry, index) => (
//             <button
//               key={index}
//               onClick={() => {
//                 if (entry.type === "directory") {
//                   navigate(`/explore/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//                 } else {
//                   navigate(`/view/${repoName}?path=${currentPath ? currentPath + "/" + entry.name : entry.name}`);
//                 }
//               }}
//               style={{
//                 padding: "8px 16px",
//                 textAlign: "left",
//                 cursor: "pointer",
//                 backgroundColor: "#f6f8fa",
//                 border: "1px solid #d1d5da",
//                 borderRadius: "6px",
//                 width: "fit-content",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",
//               }}
//             >
//               {entry.type === "directory" ? "📁" : "📄"} {entry.name}
//             </button>
//           ))
//         ) : (
//           <p style={{ color: "#666" }}>The repository is empty or contains no supported files.</p>
//         )}
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
  const [commits, setCommits] = useState([]);
  const [selectedCommit1, setSelectedCommit1] = useState("");
  const [selectedCommit2, setSelectedCommit2] = useState("");
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Near your imports and before the RepoExplorer component’s return
const handleBranchChange = (event) => {
  // Use the previous searchParams and update only the branch parameter.
  setSearchParams((prev) => {
    const params = new URLSearchParams(prev);
    params.set("branch", event.target.value);
    // If you need to preserve "path", it should already be in prev.
    return params;
  });
};

  const fetchBranches = async () => {
    try {
      console.log("Fetching branches for repo:", repoName);
      setIsLoading(true);
      const { data } = await api.get(`/repos/${repoName}/branches`);
      console.log("Received branches:", data.branches);
      setBranches(data.branches || []);
      setError("");
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError(err.response?.data?.error || "Error fetching branches");
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommits = async () => {
    try {
      console.log("Fetching commits for repo:", repoName);
      const { data } = await api.get(`/repos/${repoName}/commits`, {
        params: { branch: currentBranch },
      });
      console.log("Received commits:", data.commits);
      setCommits(data.commits || []);
      if (data.commits?.length > 1) {
        setSelectedCommit1(data.commits[0].sha);
        setSelectedCommit2(data.commits[1].sha);
      }
    } catch (err) {
      console.error("Error fetching commits:", err);
      setError("Error fetching commit history");
    }
  };

  const fetchTree = async () => {
    try {
      console.log("Fetching tree for path:", currentPath);
      const { data } = await api.get(`/repos/${repoName}/tree`, {
        params: { path: currentPath, branch: currentBranch },
      });
      console.log("Received tree data:", data);
      setTree(data);
    } catch (err) {
      console.error("Error fetching repository contents:", err);
      setError("Error fetching repository contents");
    }
  };

  useEffect(() => {
    console.log("RepoExplorer mounted with repoName:", repoName);
    if (repoName) {
      fetchBranches();
      fetchCommits();
    }
  }, [repoName, currentBranch]);

  useEffect(() => {
    if (repoName) {
      fetchTree();
    }
  }, [repoName, currentPath, currentBranch]);

  if (isLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Loading repository...</h2>
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
      
      {/* Branch selector */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <label htmlFor="branch-select">Branch:</label>
        <select
          id="branch-select"
          value={currentBranch}
          onChange={handleBranchChange}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5da" }}
        >
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name} {branch.isHead ? "(HEAD)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Breadcrumb navigation */}
      <div style={{ marginBottom: "20px" }}>
        {currentPath.split("/").map((part, idx, arr) => (
          <span key={idx}>
            {idx > 0 && " / "}
            <Link
              to={`/explore/${repoName}?path=${arr.slice(0, idx + 1).join("/")}`}
              style={{ color: "#0366d6" }}
            >
              {idx === 0 ? "Root" : part}
            </Link>
          </span>
        ))}
      </div>

      {/* File/Directory list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tree.entries?.length > 0 ? (
          tree.entries.map((entry, index) => (
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
                padding: "8px 16px",
                textAlign: "left",
                cursor: "pointer",
                backgroundColor: "#f6f8fa",
                border: "1px solid #d1d5da",
                borderRadius: "6px",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {entry.type === "directory" ? "📁" : "📄"} {entry.name}
            </button>
          ))
        ) : (
          <p style={{ color: "#666" }}>
            This repository is empty or contains no supported files.
          </p>
        )}
      </div>
    </div>
  );
}

export default RepoExplorer;