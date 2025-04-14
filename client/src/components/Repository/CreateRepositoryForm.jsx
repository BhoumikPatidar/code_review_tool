import React, { useState } from 'react';
import api from '../../utils/api';

function CreateRepositoryForm({ onRepositoryCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear name error when user types
    if (name === 'name') {
      setNameError('');
    }
  };

  const validateName = (name) => {
    // Repository name validation (similar to GitHub rules)
    if (!name) {
      setNameError('Repository name is required');
      return false;
    }
    
    if (name.length > 100) {
      setNameError('Repository name is too long (maximum is 100 characters)');
      return false;
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      setNameError('Repository name can only contain letters, numbers, dots, hyphens, and underscores');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate name
    if (!validateName(formData.name)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/repos/create', formData);
      console.log('Repository created:', response.data);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        visibility: 'private'
      });
      
      // Notify parent component
      if (onRepositoryCreated) {
        onRepositoryCreated();
      }
    } catch (err) {
      console.error('Error creating repository:', err);
      setError(err.response?.data?.error || 'Error creating repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#fff',
      border: '1px solid #d1d5da',
      borderRadius: '6px'
    }}>
      <h2 style={{ marginTop: 0 }}>Create a new repository</h2>
      
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
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="name" 
            style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold' 
            }}
          >
            Repository name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="my-awesome-project"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: nameError ? '1px solid #cf222e' : '1px solid #d1d5da',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
            required
          />
          {nameError && (
            <p style={{ 
              margin: '4px 0 0', 
              color: '#cf222e', 
              fontSize: '12px' 
            }}>
              {nameError}
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="description" 
            style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold' 
            }}
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Short description of your repository"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5da',
              borderRadius: '6px',
              boxSizing: 'border-box',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: 'bold' 
          }}>
            Visibility
          </label>
          
          <div style={{ 
            border: '1px solid #d1d5da', 
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '12px', 
              borderBottom: '1px solid #d1d5da',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: formData.visibility === 'public' ? '#f6f8fa' : '#fff'
            }}>
              <input
                type="radio"
                id="public"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="public" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>🌍</span>
                <div>
                  <strong>Public</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#586069' }}>
                    Anyone can see this repository. You choose who can commit.
                  </p>
                </div>
              </label>
            </div>
            
            <div style={{ 
              padding: '12px', 
              display: 'flex',
              alignItems: 'center',
              backgroundColor: formData.visibility === 'private' ? '#f6f8fa' : '#fff'
            }}>
              <input
                type="radio"
                id="private"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="private" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>🔒</span>
                <div>
                  <strong>Private</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#586069' }}>
                    You choose who can see and commit to this repository.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2da44e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create repository'}
        </button>
      </form>
    </div>
  );
}

export default CreateRepositoryForm;