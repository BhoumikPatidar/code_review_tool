import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MergeConflicts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts, pr } = location.state || {};

  if (!conflicts) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>No conflict information available</h2>
        <button onClick={() => navigate('/prs')}>
          Back to Pull Requests
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merge Conflicts</h2>
      <div style={{ marginBottom: "20px" }}>
        <p>Pull Request #{pr?.id}: Merging {pr?.sourceBranch} into {pr?.targetBranch}</p>
        <p>The following files have conflicts that need to be resolved:</p>
      </div>

      {conflicts.map((conflict, index) => (
        <div key={index} style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#24292e" }}>
            File: {conflict.file}
          </h3>
          <div style={{ 
            border: "1px solid #d1d5da",
            borderRadius: "6px",
            overflow: "hidden" 
          }}>
            <SyntaxHighlighter
              language="javascript"
              style={vs}
              customStyle={{
                margin: 0,
                padding: "16px",
                backgroundColor: "#f6f8fa"
              }}
            >
              {conflict.content}
            </SyntaxHighlighter>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "2rem" }}>
        <button 
          onClick={() => navigate('/prs')}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0366d6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Back to Pull Requests
        </button>
      </div>
    </div>
  );
}

export default MergeConflicts;