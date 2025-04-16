import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function PRConflicts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts, prId } = location.state || {};
  const [resolutions, setResolutions] = useState({});
  const [selectedFile, setSelectedFile] = useState(conflicts?.[0]?.file || null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If no conflict information is available, show a message
  if (!conflicts || conflicts.length === 0) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>No conflict information available</h2>
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
    );
  }

  // Handle selecting a file to view/resolve
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // Get the currently selected conflict
  const selectedConflict = conflicts.find(c => c.file === selectedFile);

  // Helper function to colorize conflict markers and content
  const colorizeConflictContent = (content) => {
    if (!content) return null;
    
    return content.split('\n').map((line, idx) => {
      let style = {};
      
      if (line.startsWith('<<<<<<<')) {
        style = { 
          backgroundColor: '#ffdddd', 
          fontWeight: 'bold',
          color: '#721c24'
        };
      } else if (line.startsWith('=======')) {
        style = { 
          backgroundColor: '#eeeeee', 
          fontWeight: 'bold',
          color: '#333333'
        };
      } else if (line.startsWith('>>>>>>>')) {
        style = { 
          backgroundColor: '#d1e7dd', 
          fontWeight: 'bold',
          color: '#155724'
        };
      } else if (selectedConflict) {
        // Lines from target branch (ours)
        const markerStart = content.indexOf('<<<<<<<');
        const markerMiddle = content.indexOf('=======');
        const markerEnd = content.indexOf('>>>>>>>');
        
        if (markerStart !== -1 && markerMiddle !== -1 && markerEnd !== -1) {
          const currentLineIndex = content.slice(0, content.indexOf(line) + line.length).split('\n').length - 1;
          const startLineIndex = content.slice(0, markerStart).split('\n').length - 1;
          const middleLineIndex = content.slice(0, markerMiddle).split('\n').length - 1;
          const endLineIndex = content.slice(0, markerEnd).split('\n').length - 1;
          
          if (currentLineIndex > startLineIndex && currentLineIndex < middleLineIndex) {
            style = { backgroundColor: '#ffeeee', color: '#721c24' }; // Target branch (ours)
          } else if (currentLineIndex > middleLineIndex && currentLineIndex < endLineIndex) {
            style = { backgroundColor: '#eeffee', color: '#155724' }; // Source branch (theirs)
          }
        }
      }
      
      return (
        <div key={idx} style={style}>
          {line}
        </div>
      );
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merge Conflicts</h2>
      <p>The following files have conflicts that need to be resolved:</p>
      
      <div style={{ display: "flex", marginTop: "2rem" }}>
        {/* File list sidebar */}
        <div style={{ 
          width: "250px", 
          borderRight: "1px solid #ddd", 
          marginRight: "1rem",
          padding: "1rem"
        }}>
          <h3>Conflicted Files</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {conflicts.map((conflict, index) => (
              <li 
                key={index}
                onClick={() => handleFileSelect(conflict.file)}
                style={{ 
                  padding: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedFile === conflict.file ? "#f0f0f0" : "transparent",
                  borderRadius: "4px",
                  marginBottom: "4px"
                }}
              >
                <span style={{ 
                  display: "flex", 
                  alignItems: "center",
                  fontWeight: selectedFile === conflict.file ? "bold" : "normal"
                }}>
                  🔄 {conflict.file}
                </span>
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: "2rem" }}>
            <button 
              onClick={() => navigate('/prs')}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
                marginBottom: "10px"
              }}
            >
              Back to Pull Requests
            </button>
          </div>
        </div>
        
        {/* File content and conflict resolution */}
        <div style={{ flex: 1 }}>
          {selectedConflict && (
            <div>
              <h3>Resolving conflicts in: {selectedConflict.file}</h3>
              
              <div style={{ 
                backgroundColor: "#f6f8fa",
                padding: "1rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                maxHeight: "500px",
                overflowY: "auto",
                fontFamily: "monospace",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap"
              }}>
                {colorizeConflictContent(selectedConflict.content)}
              </div>
              
              <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
                <h4>Conflict Information</h4>
                <p>This file has conflicts between the following branches:</p>
                <ul>
                  <li><strong>Target Branch:</strong> {selectedConflict.ourBranch}</li>
                  <li><strong>Source Branch:</strong> {selectedConflict.theirBranch}</li>
                </ul>
                <p>
                  To resolve this conflict, you need to decide which changes to keep.
                  You can choose the target branch version, the source branch version,
                  or manually edit the file to combine the changes.
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button 
                  onClick={() => navigate('/prs')}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PRConflicts;