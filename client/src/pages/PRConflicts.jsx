import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function PRConflicts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts } = location.state || {};

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
      <p>The following files have conflicts that need to be resolved:</p>
      
      <div style={{ marginTop: "2rem" }}>
        {conflicts.map((conflict, index) => (
          <div 
            key={index}
            style={{ 
              marginBottom: "2rem",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <h3>File: {conflict.file}</h3>
            <pre style={{ 
              backgroundColor: "#f6f8fa",
              padding: "1rem",
              borderRadius: "4px",
              overflowX: "auto"
            }}>
              {conflict.content}
            </pre>
          </div>
        ))}
      </div>

      <button 
        onClick={() => navigate('/prs')}
        style={{ marginTop: "2rem" }}
      >
        Back to Pull Requests
      </button>
    </div>
  );
}

export default PRConflicts;