import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function PRConflicts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conflicts, prId } = location.state || {};
  const [resolutions, setResolutions] = useState({});
  const [manualEdits, setManualEdits] = useState({});
  const [selectedFile, setSelectedFile] = useState(conflicts?.[0]?.file || null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionMode, setResolutionMode] = useState('view'); // 'view', 'ours', 'theirs', 'manual'

  // Initialize resolution state
  useEffect(() => {
    if (conflicts) {
      const initialResolutions = {};
      const initialEdits = {};
      
      conflicts.forEach(conflict => {
        initialResolutions[conflict.file] = 'unresolved';
        initialEdits[conflict.file] = conflict.content;
      });
      
      setResolutions(initialResolutions);
      setManualEdits(initialEdits);
    }
  }, [conflicts]);

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

  // Check if all conflicts are resolved
  const allResolved = Object.values(resolutions).every(
    resolution => resolution !== 'unresolved'
  );

  // Handle selecting a file to view/resolve
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setResolutionMode('view');
  };

  // Handle choosing "our" version (target branch)
  const handleChooseOurs = () => {
    if (!selectedFile) return;
    
    setResolutionMode('ours');
    setResolutions(prev => ({
      ...prev,
      [selectedFile]: 'ours'
    }));
  };

  // Handle choosing "their" version (source branch)
  const handleChooseTheirs = () => {
    if (!selectedFile) return;
    
    setResolutionMode('theirs');
    setResolutions(prev => ({
      ...prev,
      [selectedFile]: 'theirs'
    }));
  };

  // Handle switching to manual edit mode
  const handleManualEdit = () => {
    if (!selectedFile) return;
    
    setResolutionMode('manual');
    setResolutions(prev => ({
      ...prev,
      [selectedFile]: 'manual'
    }));
  };

  // Handle manual content changes
  const handleManualContentChange = (e) => {
    if (!selectedFile) return;
    
    setManualEdits(prev => ({
      ...prev,
      [selectedFile]: e.target.value
    }));
  };

  // Handle submitting all resolutions
  const handleSubmitResolutions = async () => {
    if (!allResolved) {
      setErrorMessage("Please resolve all conflicts before submitting");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Prepare the resolution data
      const resolutionData = {};
      
      Object.keys(resolutions).forEach(file => {
        const resolutionType = resolutions[file];
        const selectedConflict = conflicts.find(c => c.file === file);
        
        if (resolutionType === 'ours') {
          resolutionData[file] = selectedConflict.ourContent;
        } else if (resolutionType === 'theirs') {
          resolutionData[file] = selectedConflict.theirContent;
        } else if (resolutionType === 'manual') {
          resolutionData[file] = manualEdits[file];
        }
      });

      // Submit resolutions to the API
      const response = await api.post(`/prs/${prId}/resolve-conflicts`, {
        resolutions: resolutionData
      });
      
      setSuccessMessage("Conflicts resolved successfully!");
      
      // If the merge was successful, navigate back to the PR detail page
      if (response.data.status === 'merged') {
        setTimeout(() => {
          navigate(`/prs/${prId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting resolutions:", error);
      setErrorMessage(error.response?.data?.error || "Failed to submit resolutions");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the currently selected conflict
  const selectedConflict = conflicts.find(c => c.file === selectedFile);

  // Helper to extract content from the conflict markers
  const extractConflictParts = (content) => {
    if (!content) return { ourContent: '', theirContent: '' };
    
    const markerStart = content.indexOf('<<<<<<<');
    const markerMiddle = content.indexOf('=======');
    const markerEnd = content.indexOf('>>>>>>>');
    
    if (markerStart === -1 || markerMiddle === -1 || markerEnd === -1) {
      return { ourContent: content, theirContent: content };
    }
    
    const ourContent = content.substring(
      content.indexOf('\n', markerStart) + 1, 
      markerMiddle
    ).trim();
    
    const theirContent = content.substring(
      content.indexOf('\n', markerMiddle) + 1,
      markerEnd
    ).trim();
    
    return { ourContent, theirContent };
  };

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

  // Function to get the content to display based on resolution mode
  const getContentForDisplay = () => {
    if (!selectedConflict) return '';
    
    const { file } = selectedConflict;
    const resolutionType = resolutions[file];
    
    if (resolutionMode === 'view' || resolutionType === 'unresolved') {
      return selectedConflict.content;
    }
    
    if (resolutionMode === 'ours' || resolutionType === 'ours') {
      return selectedConflict.ourContent;
    }
    
    if (resolutionMode === 'theirs' || resolutionType === 'theirs') {
      return selectedConflict.theirContent;
    }
    
    // For manual mode, show the editable content
    if (resolutionMode === 'manual' || resolutionType === 'manual') {
      return manualEdits[file];
    }
    
    return selectedConflict.content;
  };

  // Get the file status indicator
  const getFileStatusIndicator = (file) => {
    const status = resolutions[file];
    
    if (status === 'unresolved') {
      return <span style={{ color: 'red' }}>⚠️</span>;
    } else if (status === 'ours') {
      return <span style={{ color: 'blue' }}>🔹</span>;
    } else if (status === 'theirs') {
      return <span style={{ color: 'green' }}>🔸</span>;
    } else if (status === 'manual') {
      return <span style={{ color: 'purple' }}>✏️</span>;
    }
    
    return <span>🔄</span>;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merge Conflicts</h2>
      <p>The following files have conflicts that need to be resolved:</p>
      
      {errorMessage && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green', borderRadius: '4px', marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}
      
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
                  justifyContent: "space-between",
                  fontWeight: selectedFile === conflict.file ? "bold" : "normal"
                }}>
                  {getFileStatusIndicator(conflict.file)} {conflict.file}
                </span>
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: "2rem" }}>
            <button 
              onClick={handleSubmitResolutions}
              disabled={!allResolved || isSubmitting}
              style={{
                padding: "8px 16px",
                backgroundColor: allResolved ? "#2ea44f" : "#cccccc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: allResolved ? "pointer" : "not-allowed",
                width: "100%",
                marginBottom: "10px"
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit All Resolutions"}
            </button>
            
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
              Cancel
            </button>
          </div>
        </div>
        
        {/* File content and conflict resolution */}
        <div style={{ flex: 1 }}>
          {selectedConflict && (
            <div>
              <h3>
                Resolving conflicts in: {selectedConflict.file}
                <span style={{ 
                  marginLeft: '10px', 
                  fontSize: '14px', 
                  color: resolutions[selectedConflict.file] === 'unresolved' ? 'red' : 'green'
                }}>
                  ({resolutions[selectedConflict.file] === 'unresolved' ? 'Unresolved' : 'Resolved'})
                </span>
              </h3>
              
              {/* Resolution option buttons */}
              <div style={{ marginBottom: '1rem' }}>
                <button
                  onClick={handleChooseOurs}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: resolutionMode === 'ours' ? '#0366d6' : '#f3f4f6',
                    color: resolutionMode === 'ours' ? 'white' : 'black',
                    border: '1px solid #d1d5da',
                    borderRadius: '6px',
                    marginRight: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Use Target Branch ({selectedConflict.ourBranch})
                </button>
                
                <button
                  onClick={handleChooseTheirs}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: resolutionMode === 'theirs' ? '#2ea44f' : '#f3f4f6',
                    color: resolutionMode === 'theirs' ? 'white' : 'black',
                    border: '1px solid #d1d5da',
                    borderRadius: '6px',
                    marginRight: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Use Source Branch ({selectedConflict.theirBranch})
                </button>
                
                <button
                  onClick={handleManualEdit}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: resolutionMode === 'manual' ? '#6f42c1' : '#f3f4f6',
                    color: resolutionMode === 'manual' ? 'white' : 'black',
                    border: '1px solid #d1d5da',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Manual Edit
                </button>
              </div>
              
              {/* File content display */}
              {resolutionMode === 'manual' ? (
                <textarea
                  value={manualEdits[selectedConflict.file] || ''}
                  onChange={handleManualContentChange}
                  style={{
                    width: '100%',
                    height: '400px',
                    fontFamily: 'monospace',
                    padding: '1rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5da',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ 
                  backgroundColor: "#f6f8fa",
                  padding: "1rem",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontFamily: "monospace",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap"
                }}>
                  {resolutionMode === 'view' 
                    ? colorizeConflictContent(getContentForDisplay())
                    : getContentForDisplay()
                  }
                </div>
              )}
              
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PRConflicts;