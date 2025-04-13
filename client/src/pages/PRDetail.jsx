// // src/pages/PRDetail.jsx
// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import api from "../utils/api";
// import StaticAnalysisReport from "./StaticAnalysisReport";
// import { TextField } from "@mui/material";

// function PRDetail() {
//   const { id } = useParams(); // PR ID from the URL
//   const [pr, setPr] = useState(null);
//   const [analysisReports, setAnalysisReports] = useState(null);
//   const [commits, setCommits] = useState([]);
//   const [selectedCommit, setSelectedCommit] = useState(null);
//   const [diff, setDiff] = useState(null);
//   const [loadingDiff, setLoadingDiff] = useState(false);
//   const [error, setError] = useState("");
//   const [prComments, setPrComments] = useState([]);
//   const [newComment, setNewComment] = useState("");
//   const [loadingAnalysis, setLoadingAnalysis] = useState(false);

//   // Fetch PR details
//   useEffect(() => {
//     const fetchPR = async () => {
//       try {
//         const { data } = await api.get(`/prs/${id}`);
//         setPr(data);
//       } catch (err) {
//         console.error(err);
//         setError("Error fetching PR details");
//       }
//     };
//     fetchPR();
//   }, [id]);

//   // Fetch commit history for the repository from the source branch
//   useEffect(() => {
//     if (pr && pr.repository && pr.sourceBranch) {
//       const fetchCommits = async () => {
//         try {
//           const { data } = await api.get(`/repos/${pr.repository}/commits`);
//           setCommits(data.commits);
//         } catch (err) {
//           console.error(err);
//           setError("Error fetching commit history");
//         }
//       };
//       fetchCommits();
//     }
//   }, [pr]);

//   // Fetch PR comments
//   const fetchPRComments = async () => {
//     try {
//       const { data } = await api.get(`/prcomments/${id}`);
//       setPrComments(data);
//     } catch (err) {
//       console.error(err);
//       setError("Error fetching PR comments");
//     }
//   };
//   useEffect(() => {
//     if (pr) {
//       fetchPRComments();
//     }
//   }, [pr]);

//   // Fetch diff for a selected commit
//   const handleCommitClick = async (commitSha) => {
//     setSelectedCommit(commitSha);
//     setLoadingDiff(true);
//     setDiff(null);
//     try {
//       const { data } = await api.get(
//         `/repos/${pr.repository}/diff/${commitSha}`
//       );
//       setDiff(data.diffs);
//     } catch (err) {
//       console.error(err);
//       setError("Error fetching diff for commit");
//     }
//     setLoadingDiff(false);
//   };

//   // Handle posting a new PR comment
//   const handlePostComment = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post("/prcomments", { prId: pr.id, comment: newComment });
//       setNewComment("");
//       fetchPRComments();
//     } catch (err) {
//       console.error(err);
//       setError("Error posting comment");
//     }
//   };

//   // Trigger static analysis and update state with results
//   const handleRunStaticAnalysis = async () => {
//     setLoadingAnalysis(true);
//     setError("");
//     try {
//       const { data } = await api.post(`/prs/${id}/static-analysis`);
//       setAnalysisReports(data.reports);
//     } catch (err) {
//       console.error("Failed to run static analysis:", err);
//       setError(err.response?.data?.error || "Failed to run static analysis");
//     }
//     setLoadingAnalysis(false);
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Pull Request Details</h2>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {pr ? (
//         <div>
//           <h3>{pr.title}</h3>
//           <p>{pr.description}</p>
//           <p>
//             <strong>Repository:</strong> {pr.repository} |{" "}
//             <strong>Source Branch:</strong> {pr.sourceBranch} |{" "}
//             <strong>Target Branch:</strong> {pr.targetBranch}
//           </p>
//           <p>
//             <strong>Status:</strong> {pr.status}
//           </p>
//           <hr />
//           <h3>Commit History (Source Branch)</h3>
//           {commits.length === 0 ? (
//             <p>No commits found.</p>
//           ) : (
//             <ul>
//               {commits.map((commit) => (
//                 <li key={commit.sha}>
//                   <button onClick={() => handleCommitClick(commit.sha)}>
//                     {commit.sha.substring(0, 7)} - {commit.message}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//           {loadingDiff && <p>Loading diff...</p>}
//           {diff && (
//             <div>
//               <h3>Diff for Commit {selectedCommit}</h3>
//               {diff.map((d, index) => (
//                 <div
//                   key={index}
//                   style={{
//                     marginBottom: "1rem",
//                     border: "1px solid #ccc",
//                     padding: "0.5rem",
//                   }}
//                 >
//                   <p>
//                     <strong>File:</strong> {d.file}
//                   </p>
//                   <p>
//                     <strong>Status:</strong> {d.status}
//                   </p>
//                   <p>
//                     <strong>Additions:</strong> {d.additions} &nbsp;{" "}
//                     <strong>Deletions:</strong> {d.deletions}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           )}
//           <hr />
//           <h3>PR Comments</h3>
//           {prComments.length === 0 ? (
//             <p>No comments yet.</p>
//           ) : (
//             <ul>
//               {prComments.map((c) => (
//                 <li key={c.id}>
//                   <p>{c.comment}</p>
//                   <small>By: {c.author?.username}</small>
//                 </li>
//               ))}
//             </ul>
//           )}
//           <form onSubmit={handlePostComment}>
//             <TextField
//               label="Add your comment..."
//               multiline
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               rows="3"
//               style={{ width: "25%" }}
//               required
//             />
//             <br />
//             <br />
//             <button type="submit">Post Comment</button>
//           </form>
//           <br />
//           <hr />
//           <br />
//           <button onClick={handleRunStaticAnalysis}>
//             {loadingAnalysis
//               ? "Running Static Analysis..."
//               : "Run Static Analysis"}
//           </button>
//           {analysisReports && (
//             <div style={{ marginTop: "1rem" }}>
//               <h3>Static Analysis Report</h3>
//               {analysisReports.map((report, index) => (
//                 <div
//                   key={index}
//                   style={{
//                     border: "1px solid #ccc",
//                     marginBottom: "1rem",
//                     padding: "0.5rem",
//                   }}
//                 >
//                   <h4>{report.tool}</h4>
//                   <pre>{report.result}</pre>
//                 </div>
//               ))}
//             </div>
//           )}
//           <StaticAnalysisReport prId={id} />
//         </div>
//       ) : (
//         <p>Loading PR details...</p>
//       )}
//     </div>
//   );
// }

// export default PRDetail;







import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import StaticAnalysisReport from "./StaticAnalysisReport";
import { TextField } from "@mui/material";

function PRDetail() {
  const { id } = useParams(); // PR ID from the URL
  const [pr, setPr] = useState(null);
  const [analysisReports, setAnalysisReports] = useState(null);
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [branchDiff, setBranchDiff] = useState(null); // For source and target branch diff
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState("");
  const [prComments, setPrComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [filesWithDiffs, setFilesWithDiffs] = useState([]);
  const [selectedFileDiff, setSelectedFileDiff] = useState(null);

  // Fetch PR details
  useEffect(() => {
    const fetchPR = async () => {
      try {
        const { data } = await api.get(`/prs/${id}`);
        setPr(data);
      } catch (err) {
        console.error(err);
        setError("Error fetching PR details");
      }
    };
    fetchPR();
  }, [id]);

  // Fetch commit history for the repository from the source branch
  useEffect(() => {
    if (pr && pr.repository && pr.sourceBranch) {
      const fetchCommits = async () => {
        try {
          const { data } = await api.get(`/repos/${pr.repository}/commits`);
          setCommits(data.commits);
        } catch (err) {
          console.error(err);
          setError("Error fetching commit history");
        }
      };
      fetchCommits();
    }
  }, [pr]);

  // Fetch PR comments
  const fetchPRComments = async () => {
    try {
      const { data } = await api.get(`/prcomments/${id}`);
      setPrComments(data);
    } catch (err) {
      console.error(err);
      setError("Error fetching PR comments");
    }
  };

  // Fetch diff between source and target branches
  const fetchBranchDiff = async () => {
    if (pr && pr.repository && pr.sourceBranch && pr.targetBranch) {
      try {
        const { data } = await api.get(`/repos/${pr.repository}/diff`, {
          params: {
            sourceBranch: pr.sourceBranch,
            targetBranch: pr.targetBranch,
          },
        });
        console.log("Files with differences:", data.files); // Debug log
        setFilesWithDiffs(data.files || []);
      } catch (err) {
        console.error("Error fetching branch diff:", err);
        setError("Error fetching branch diff");
      }
    }
  };

  useEffect(() => {
    if (pr) {
      fetchBranchDiff();
      fetchPRComments();
    }
  }, [pr]);

  // Fetch diff for a selected commit
  const handleCommitClick = async (commitSha) => {
    setSelectedCommit(commitSha);
    setLoadingDiff(true);
    setDiff(null);
    try {
      const { data } = await api.get(`/repos/${pr.repository}/diff/${commitSha}`);
      setDiff(data.diffs);
    } catch (err) {
      console.error(err);
      setError("Error fetching diff for commit");
    }
    setLoadingDiff(false);
  };

  // Handle posting a new PR comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/prcomments", { prId: pr.id, comment: newComment });
      setNewComment("");
      fetchPRComments();
    } catch (err) {
      console.error(err);
      setError("Error posting comment");
    }
  };

  // Trigger static analysis and update state with results
  const handleRunStaticAnalysis = async () => {
    setLoadingAnalysis(true);
    setError("");
    try {
      const { data } = await api.post(`/prs/${id}/static-analysis`);
      setAnalysisReports(data.reports);
    } catch (err) {
      console.error("Failed to run static analysis:", err);
      setError(err.response?.data?.error || "Failed to run static analysis");
    }
    setLoadingAnalysis(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Pull Request Details</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {pr ? (
        <div>
          <h3>{pr.title}</h3>
          <p>{pr.description}</p>
          <p>
            <strong>Repository:</strong> {pr.repository} |{" "}
            <strong>Source Branch:</strong> {pr.sourceBranch} |{" "}
            <strong>Target Branch:</strong> {pr.targetBranch}
          </p>
          <p>
            <strong>Status:</strong> {pr.status}
          </p>
          <hr />
          <h3>Diff Between Source and Target Branch</h3>
          {filesWithDiffs.length > 0 ? (
            <ul>
              {filesWithDiffs.map((file, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => setSelectedFileDiff(file.diff)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0366d6",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {file.file}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No differences found.</p>
          )}

          {selectedFileDiff && (
            <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
              <h3>Diff for Selected File</h3>
              <pre
                style={{
                  background: "#f6f8fa",
                  padding: "1rem",
                  borderRadius: "6px",
                  overflowX: "auto",
                }}
              >
                {selectedFileDiff.split("\n").map((line, idx) => {
                  let color = "black";
                  if (line.startsWith("+")) color = "green";
                  if (line.startsWith("-")) color = "red";
                  return (
                    <span key={idx} style={{ color }}>
                      {line}
                    </span>
                  );
                })}
              </pre>
            </div>
          )}
          <hr />
          <h3>Commit History (Source Branch)</h3>
          {commits.length === 0 ? (
            <p>No commits found.</p>
          ) : (
            <ul>
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <button onClick={() => handleCommitClick(commit.sha)}>
                    {commit.sha.substring(0, 7)} - {commit.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loadingDiff && <p>Loading diff...</p>}
          {diff && (
            <div>
              <h3>Diff for Commit {selectedCommit}</h3>
              {diff.map((d, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1rem",
                    border: "1px solid #ccc",
                    padding: "0.5rem",
                  }}
                >
                  <p>
                    <strong>File:</strong> {d.file}
                  </p>
                  <p>
                    <strong>Status:</strong> {d.status}
                  </p>
                  <p>
                    <strong>Additions:</strong> {d.additions} &nbsp;{" "}
                    <strong>Deletions:</strong> {d.deletions}
                  </p>
                </div>
              ))}
            </div>
          )}
          <hr />
          <h3>PR Comments</h3>
          {prComments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            <ul>
              {prComments.map((c) => (
                <li key={c.id}>
                  <p>{c.comment}</p>
                  <small>By: {c.author?.username}</small>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handlePostComment}>
            <TextField
              label="Add your comment..."
              multiline
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="3"
              style={{ width: "25%" }}
              required
            />
            <br />
            <br />
            <button type="submit">Post Comment</button>
          </form>
          <br />
          <hr />
          <br />
          <button onClick={handleRunStaticAnalysis}>
            {loadingAnalysis
              ? "Running Static Analysis..."
              : "Run Static Analysis"}
          </button>
          {analysisReports && (
            <div style={{ marginTop: "1rem" }}>
              <h3>Static Analysis Report</h3>
              {analysisReports.map((report, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ccc",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                  }}
                >
                  <h4>{report.tool}</h4>
                  <pre>{report.result}</pre>
                </div>
              ))}
            </div>
          )}
          <StaticAnalysisReport prId={id} />
        </div>
      ) : (
        <p>Loading PR details...</p>
      )}
    </div>
  );
}

export default PRDetail;