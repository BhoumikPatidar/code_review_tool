import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "../utils/api";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

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
      <h2>Viewing file: {filePath}</h2>
      <Link to={`/explore/${repoName}?path=${filePath.substring(0, filePath.lastIndexOf("/"))}`}>
        Back to folder
      </Link>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {content && (
        <SyntaxHighlighter language="javascript">
          {content}
        </SyntaxHighlighter>
      )}
    </div>
  );
}

export default FileViewer;