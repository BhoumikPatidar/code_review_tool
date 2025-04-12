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

  useEffect(() => {
    if (filePath) fetchContent();
  }, [repoName, filePath]);

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

      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {content && (
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