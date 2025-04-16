import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MergeConflicts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts, pr } = location.state || {};

  const renderConflictContent = (content) => {
    return content.split('\n').map((line, i) => {
      let backgroundColor = 'transparent';
      let color = 'black';
      
      if (line.startsWith('<<<<<<<')) {
        backgroundColor = '#ffe5e5';
      } else if (line.startsWith('=======')) {
        backgroundColor = '#e5e5e5';
      } else if (line.startsWith('>>>>>>>')) {
        backgroundColor = '#e5ffe5';
      } else if (line.startsWith('-')) {
        color = '#ff0000';
      } else if (line.startsWith('+')) {
        color = '#00aa00';
      }
      
      return (
        <div key={i} style={{ backgroundColor, color, padding: '2px 4px' }}>
          {line}
        </div>
      );
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merge Conflicts Detected</h2>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: '#d73a49', fontWeight: 'bold' }}>
          Pull Request #{pr?.id}: Cannot automatically merge {pr?.sourceBranch} into {pr?.targetBranch}
        </p>
        <p>The following files have conflicts that must be resolved before merging:</p>
      </div>

      {conflicts.map((conflict, index) => (
        <div key={index} style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#24292e" }}>
            🚫 {conflict.file}
          </h3>
          <div style={{ 
            border: "1px solid #d1d5da",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#f6f8fa"
          }}>
            <div style={{ padding: "16px" }}>
              {renderConflictContent(conflict.content)}
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "2rem" }}>
        <p style={{ marginBottom: "1rem", color: '#666' }}>
          Please resolve these conflicts locally and try merging again.
        </p>
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