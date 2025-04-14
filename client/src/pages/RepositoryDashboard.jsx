import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RepositoryList from '../components/Repository/RepositoryList';
import repositoryService from '../services/repositoryService';

function RepositoryDashboard() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const repos = await repositoryService.getRepositories();
      setRepositories(repos);
      setError('');
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Failed to load repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Your Repositories</h2>
        <Link
          to="/repositories/new"
          style={{
            padding: '8px 16px',
            backgroundColor: '#2da44e',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          New repository
        </Link>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#ffebe9',
          borderRadius: '6px',
          color: '#cf222e',
          marginBottom: '16px'
        }}>
          {error}
          <button
            onClick={fetchRepositories}
            style={{
              marginLeft: '10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#0366d6',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Loading repositories...</p>
        </div>
      ) : (
        <RepositoryList repositories={repositories} />
      )}
    </div>
  );
}

export default RepositoryDashboard;