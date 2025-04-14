import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import repositoryService from '../services/repositoryService';

function RepositorySettings() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionLevel, setPermissionLevel] = useState('READER');
  
  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch repository details and collaborators
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [repoData, collaboratorsData] = await Promise.all([
          repositoryService.getRepository(repoId),
          repositoryService.getCollaborators(repoId)
        ]);
        
        setRepository(repoData);
        setCollaborators(collaboratorsData);
        setError('');
      } catch (err) {
        console.error('Error fetching repository data:', err);
        if (err.response?.status === 403) {
          setError('You do not have permission to manage this repository');
          setTimeout(() => navigate('/repositories'), 3000);
        } else {
          setError('Failed to load repository settings. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [repoId, navigate]);

  // Handle user search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setSearching(true);
    try {
      const users = await repositoryService.searchUsers(searchQuery);
      
      // Filter out users who are already collaborators
      const existingCollaboratorIds = collaborators.map(c => c.userId);
      const filteredUsers = users.filter(user => !existingCollaboratorIds.includes(user.id));
      
      setSearchResults(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  // Handle user selection from search results
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Add a collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSubmitting(true);
    try {
      await repositoryService.addCollaborator(repoId, selectedUser.id, permissionLevel);
      
      // Refresh collaborators list
      const updatedCollaborators = await repositoryService.getCollaborators(repoId);
      setCollaborators(updatedCollaborators);
      
      // Reset form
      setSelectedUser(null);
      setPermissionLevel('READER');
      setSuccessMessage(`${selectedUser.username} has been added as a collaborator with ${permissionLevel} permission`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError(err.response?.data?.error || 'Failed to add collaborator');
    } finally {
      setSubmitting(false);
    }
  };

  // Update a collaborator's permission level
  const handleUpdatePermission = async (userId, newPermissionLevel) => {
    setSubmitting(true);
    try {
      await repositoryService.updateCollaborator(repoId, userId, newPermissionLevel);
      
      // Refresh collaborators list
      const updatedCollaborators = await repositoryService.getCollaborators(repoId);
      setCollaborators(updatedCollaborators);
      
      setSuccessMessage('Collaborator permission updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating collaborator permission:', err);
      setError(err.response?.data?.error || 'Failed to update collaborator permission');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove a collaborator
  const handleRemoveCollaborator = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }
    
    setSubmitting(true);
    try {
      await repositoryService.removeCollaborator(repoId, userId);
      
      // Update collaborators list
      setCollaborators(collaborators.filter(c => c.userId !== userId));
      
      setSuccessMessage('Collaborator removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2>Repository Settings</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#ffebe9',
          borderRadius: '6px',
          color: '#cf222e',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={{
          padding: '16px',
          backgroundColor: '#e6ffec',
          borderRadius: '6px',
          color: '#24292e',
          marginBottom: '16px'
        }}>
          {successMessage}
        </div>
      )}
      
      {repository && (
        <>
          <h2>Settings for {repository.name}</h2>
          
          <div style={{
            padding: '24px',
            backgroundColor: '#fff',
            border: '1px solid #d1d5da',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginTop: 0 }}>Repository Details</h3>
            <p><strong>Name:</strong> {repository.name}</p>
            <p><strong>Description:</strong> {repository.description || 'No description'}</p>
            <p><strong>Visibility:</strong> {repository.visibility}</p>
            <p><strong>Owner:</strong> {repository.owner?.username}</p>
          </div>
          
          <div style={{
            padding: '24px',
            backgroundColor: '#fff',
            border: '1px solid #d1d5da',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginTop: 0 }}>Collaborators</h3>
            
            {collaborators.length === 0 ? (
              <p>This repository has no collaborators yet.</p>
            ) : (
              <div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #d1d5da' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Username</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Permission Level</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborators.map(collaborator => (
                      <tr key={collaborator.userId} style={{ borderBottom: '1px solid #d1d5da' }}>
                        <td style={{ padding: '8px' }}>{collaborator.username}</td>
                        <td style={{ padding: '8px' }}>
                          <select
                            value={collaborator.permissionLevel}
                            onChange={(e) => handleUpdatePermission(collaborator.userId, e.target.value)}
                            disabled={
                              submitting || 
                              // Don't allow changing own permission if OWNER
                              (repository.owner?.id === collaborator.userId && collaborator.permissionLevel === 'OWNER')
                            }
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5da'
                            }}
                          >
                            <option value="READER">READER</option>
                            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                            <option value="REVIEWER">REVIEWER</option>
                            <option value="APPROVER">APPROVER</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {/* Don't allow removing self or the last owner */}
                          {!(repository.owner?.id === collaborator.userId && collaborator.permissionLevel === 'OWNER') && (
                            <button
                              onClick={() => handleRemoveCollaborator(collaborator.userId)}
                              disabled={submitting}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#cf222e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: submitting ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: '24px' }}>
              <h4>Add Collaborator</h4>
              
              <form onSubmit={handleAddCollaborator}>
                <div style={{ marginBottom: '16px' }}>
                  <label 
                    htmlFor="searchUser" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      fontWeight: 'bold' 
                    }}
                  >
                    Search for user
                  </label>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex' }}>
                      <input
                        type="text"
                        id="searchUser"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by username"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5da',
                          borderRadius: '6px 0 0 6px',
                          flex: 1
                        }}
                        disabled={submitting || selectedUser !== null}
                      />
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searchQuery.trim().length < 2 || submitting || selectedUser !== null}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f6f8fa',
                          border: '1px solid #d1d5da',
                          borderLeft: 'none',
                          borderRadius: '0 6px 6px 0',
                          cursor: searchQuery.trim().length < 2 || submitting || selectedUser !== null ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && !selectedUser && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        backgroundColor: '#fff',
                        border: '1px solid #d1d5da',
                        borderRadius: '0 0 6px 6px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        zIndex: 10
                      }}>
                        {searchResults.map(user => (
                          <div 
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #f1f1f1',
                              cursor: 'pointer',
                              hover: {
                                backgroundColor: '#f6f8fa'
                              }
                            }}
                          >
                            {user.username}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedUser && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <p>
                        Adding <strong>{selectedUser.username}</strong> as a collaborator
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          style={{
                            marginLeft: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#0366d6',
                            cursor: 'pointer'
                          }}
                        >
                          (Change)
                        </button>
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label 
                        htmlFor="permissionLevel" 
                        style={{ 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: 'bold' 
                        }}
                      >
                        Permission level
                      </label>
                      <select
                        id="permissionLevel"
                        value={permissionLevel}
                        onChange={(e) => setPermissionLevel(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5da',
                          borderRadius: '6px',
                          width: '100%'
                        }}
                      >
                        <option value="READER">READER - Can read and clone the repository</option>
                        <option value="CONTRIBUTOR">CONTRIBUTOR - Can push changes and create pull requests</option>
                        <option value="REVIEWER">REVIEWER - Can review pull requests</option>
                        <option value="APPROVER">APPROVER - Can approve and merge pull requests</option>
                        <option value="OWNER">OWNER - Full admin access to the repository</option>
                      </select>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2da44e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: submitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submitting ? 'Adding...' : 'Add collaborator'}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RepositorySettings;