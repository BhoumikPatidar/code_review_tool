import React, { useState } from 'react';
import RepositoryCard from './RepositoryCard';

function RepositoryList({ repositories }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter repositories based on permission level
  const getFilteredRepositories = () => {
    if (!repositories || repositories.length === 0) return [];

    let filtered = [...repositories];
    
    // Apply permission filter
    if (filter !== 'all') {
      filtered = filtered.filter(repo => {
        if (filter === 'owned') return repo.permissionLevel === 'OWNER';
        if (filter === 'contributing') return ['CONTRIBUTOR', 'REVIEWER', 'APPROVER'].includes(repo.permissionLevel);
        if (filter === 'reading') return repo.permissionLevel === 'READER';
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(query) || 
        (repo.description && repo.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredRepositories = getFilteredRepositories();

  return (
    <div>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <button 
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'all' ? '#0366d6' : '#f6f8fa',
              color: filter === 'all' ? 'white' : '#24292e',
              border: '1px solid #d1d5da',
              borderRadius: '6px 0 0 6px',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('owned')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'owned' ? '#0366d6' : '#f6f8fa',
              color: filter === 'owned' ? 'white' : '#24292e',
              border: '1px solid #d1d5da',
              borderLeft: 'none',
              cursor: 'pointer'
            }}
          >
            Owned
          </button>
          <button 
            onClick={() => setFilter('contributing')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'contributing' ? '#0366d6' : '#f6f8fa',
              color: filter === 'contributing' ? 'white' : '#24292e',
              border: '1px solid #d1d5da',
              borderLeft: 'none',
              cursor: 'pointer'
            }}
          >
            Contributing
          </button>
          <button 
            onClick={() => setFilter('reading')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'reading' ? '#0366d6' : '#f6f8fa',
              color: filter === 'reading' ? 'white' : '#24292e',
              border: '1px solid #d1d5da',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              cursor: 'pointer'
            }}
          >
            Reading
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Find a repository..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              width: '250px',
              border: '1px solid #d1d5da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {filteredRepositories.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          border: '1px solid #d1d5da'
        }}>
          <h3>No repositories found</h3>
          <p>
            {filter !== 'all' 
              ? `You don't have any ${filter === 'owned' ? 'owned' : filter === 'contributing' ? 'contributing' : 'readable'} repositories.` 
              : "You don't have any repositories yet."}
          </p>
        </div>
      ) : (
        filteredRepositories.map(repo => (
          <RepositoryCard key={repo.id} repository={repo} />
        ))
      )}
    </div>
  );
}

export default RepositoryList;