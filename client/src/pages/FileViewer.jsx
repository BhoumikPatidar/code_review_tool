// import React, { useEffect, useState } from "react";
// import { useParams, useSearchParams, Link } from "react-router-dom";
// import api from "../utils/api";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

// function FileViewer() {
//   const { repoName } = useParams();
//   const [searchParams] = useSearchParams();
//   const filePath = searchParams.get("path");
//   const [content, setContent] = useState("");
//   const [error, setError] = useState("");

//   const fetchContent = async () => {
//     try {
//       const { data } = await api.get(`/repos/${repoName}/file`, {
//         params: { path: filePath }
//       });
//       setContent(data.content);
//       setError("");
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.error || "Error fetching file content");
//     }
//   };

//   useEffect(() => {
//     if (filePath) fetchContent();
//   }, [repoName, filePath]);

//   return (
//     <div style={{ padding: "2rem" }}>
//       <div style={{ marginBottom: "20px" }}>
//         <Link 
//           to={`/explore/${repoName}?path=${filePath.substring(0, filePath.lastIndexOf("/"))}`}
//           style={{
//             textDecoration: "none",
//             color: "#0366d6",
//             display: "inline-flex",
//             alignItems: "center",
//             gap: "4px"
//           }}
//         >
//           ← Back to folder
//         </Link>
//       </div>
      
//       <h2 style={{ marginBottom: "20px" }}>
//         {filePath.split("/").pop()}
//         <span style={{ color: "#666", fontSize: "0.8em" }}> ({filePath})</span>
//       </h2>

//       {error && <p style={{ color: "red" }}>{error}</p>}
      
//       {content && (
//         <div style={{ 
//           border: "1px solid #d1d5da", 
//           borderRadius: "6px",
//           overflow: "hidden"
//         }}>
//           <SyntaxHighlighter 
//             language="javascript"
//             style={vs}
//             showLineNumbers={true}
//             customStyle={{
//               margin: 0,
//               padding: "16px",
//               backgroundColor: "#f6f8fa"
//             }}
//           >
//             {content}
//           </SyntaxHighlighter>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FileViewer;





import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "../utils/api";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

function FileViewer() {
  const { repoName } = useParams();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get("path");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [commits, setCommits] = useState([]);
  const [selectedCommit1, setSelectedCommit1] = useState("");
  const [selectedCommit2, setSelectedCommit2] = useState("");
  const [diff, setDiff] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [latestCommit, setLatestCommit] = useState(null);

  // Fetch commit history
  const fetchCommits = async () => {
    try {
      const { data } = await api.get(`/repos/${repoName}/commits`);
      setCommits(data.commits || []);
      if (data.commits?.length > 0) {
        setLatestCommit(data.commits[0]);
        setSelectedCommit1(data.commits[0].sha);
        setSelectedCommit2(data.commits[data.commits.length > 1 ? 1 : 0].sha);
      }
    } catch (err) {
      console.error("Error fetching commits:", err);
      setError(err.response?.data?.error || "Error fetching commits");
    }
  };

  // Fetch file content
  const fetchContent = async () => {
    try {
      const { data } = await api.get(`/repos/${repoName}/file`, {
        params: { path: filePath }
      });
      setContent(data.content);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error fetching file content");
    }
  };

  // Fetch diff between two commits
  const fetchDiff = async () => {
    if (selectedCommit1 && selectedCommit2) {
      try {
        const { data } = await api.get(`/repos/${repoName}/diff`, {
          params: {
            commit1: selectedCommit1,
            commit2: selectedCommit2,
            filePath: filePath
          }
        });
        setDiff(data.diff);
        setError("");
      } catch (err) {
        console.error("Error fetching diff:", err);
        setError(err.response?.data?.error || "Error fetching diff");
      }
    }
  };

  useEffect(() => {
    if (filePath) {
      fetchContent();
      fetchCommits();
    }
  }, [repoName, filePath]);

  const handleShowDiff = () => {
    setShowDiff(true);
    fetchDiff();
  };

  const handleHideDiff = () => {
    setShowDiff(false);
    setDiff(null);
  };

  const renderDiff = () => {
    if (!diff) return null;

    return (
      <div style={{ 
        border: "1px solid #d1d5da", 
        borderRadius: "6px",
        overflow: "hidden",
        marginTop: "20px"
      }}>
        {diff.split('\n').map((line, idx) => {
          let backgroundColor = "transparent";
          if (line.startsWith('+')) backgroundColor = "#e6ffec";
          if (line.startsWith('-')) backgroundColor = "#ffebe9";

          return (
            <div 
              key={idx}
              style={{
                padding: "4px 10px",
                backgroundColor,
                fontFamily: "monospace",
                whiteSpace: "pre"
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link 
          to={`/explore/${repoName}?path=${filePath.substring(0, filePath.lastIndexOf("/"))}`}
          style={{
            textDecoration: "none",
            color: "#0366d6",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ← Back to folder
        </Link>
      </div>
      
      <h2 style={{ marginBottom: "20px" }}>
        {filePath.split("/").pop()}
        <span style={{ color: "#666", fontSize: "0.8em" }}> ({filePath})</span>
      </h2>

      {latestCommit && (
        <div style={{ marginBottom: "20px", color: "#666" }}>
          Latest commit: {latestCommit.sha.substring(0, 7)} - {latestCommit.message}
        </div>
      )}

      <div style={{ marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center" }}>
        <div>
          <label htmlFor="commit1">Base commit: </label>
          <select
            id="commit1"
            value={selectedCommit1}
            onChange={(e) => setSelectedCommit1(e.target.value)}
            style={{ padding: "4px", marginLeft: "8px" }}
          >
            {commits.map(commit => (
              <option key={commit.sha} value={commit.sha}>
                {commit.sha.substring(0, 7)} - {commit.message}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="commit2">Compare with: </label>
          <select
            id="commit2"
            value={selectedCommit2}
            onChange={(e) => setSelectedCommit2(e.target.value)}
            style={{ padding: "4px", marginLeft: "8px" }}
          >
            {commits.map(commit => (
              <option key={commit.sha} value={commit.sha}>
                {commit.sha.substring(0, 7)} - {commit.message}
              </option>
            ))}
          </select>
        </div>

        {!showDiff ? (
          <button 
            onClick={handleShowDiff}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2ea44f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Show Diff
          </button>
        ) : (
          <button 
            onClick={handleHideDiff}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6e7681",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Hide Diff
          </button>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {showDiff ? (
        renderDiff()
      ) : (
        <div style={{ 
          border: "1px solid #d1d5da", 
          borderRadius: "6px",
          overflow: "hidden"
        }}>
          <SyntaxHighlighter 
            language="javascript"
            style={vs}
            showLineNumbers={true}
            customStyle={{
              margin: 0,
              padding: "16px",
              backgroundColor: "#f6f8fa"
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export default FileViewer;