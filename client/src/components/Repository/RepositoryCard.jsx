import React from 'react';
import { Link } from 'react-router-dom';

// Permission badge component with appropriate colors
const PermissionBadge = ({ level }) => {
  const getBadgeStyle = () => {
    switch (level) {
      case 'OWNER':
        return { backgroundColor: '#8250df', color: 'white' };
      case 'APPROVER':
        return { backgroundColor: '#2da44e', color: 'white' };
      case 'REVIEWER':
        return { backgroundColor: '#0969da', color: 'white' };
      case 'CONTRIBUTOR':
        return { backgroundColor: '#9a6700', color: 'white' };
      case 'READER':
      default:
        return { backgroundColor: '#6e7781', color: 'white' };
    }
  };

  return (
    <span style={{
      ...getBadgeStyle(),
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: '10px'
    }}>
      {level}
    </span>
  );
};

// Visibility indicator
const VisibilityIndicator = ({ visibility }) => {
  return (
    <span style={{
      backgroundColor: visibility === 'public' ? '#e6f2ff' : '#fff8e6',
      color: visibility === 'public' ? '#0969da' : '#9a6700',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: '10px'
    }}>
      {visibility === 'public' ? 'Public' : 'Private'}
    </span>
  );
};

function RepositoryCard({ repository }) {
  return (
    <div style={{
      border: '1px solid #d1d5da',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>
          <Link to={`/explore/${repository.name}`} style={{ color: '#0366d6', textDecoration: 'none' }}>
            {repository.name.replace(/.git$/, '')}
          </Link>
          <PermissionBadge level={repository.permissionLevel} />
          <VisibilityIndicator visibility={repository.visibility} />
        </h3>
        
        <div>
          {repository.permissionLevel === 'OWNER' && (
            <Link to={`/repos/${repository.id}/settings`} style={{ 
              textDecoration: 'none',
              padding: '6px 12px',
              fontSize: '14px',
              backgroundColor: '#f6f8fa',
              border: '1px solid #d1d5da',
              borderRadius: '6px',
              color: '#24292e'
            }}>
              Settings
            </Link>
          )}
        </div>
      </div>

      {repository.description && (
        <p style={{ 
          color: '#586069', 
          margin: '8px 0 16px', 
          fontSize: '14px' 
        }}>
          {repository.description}
        </p>
      )}

      <div style={{ 
        display: 'flex', 
        fontSize: '12px', 
        color: '#586069' 
      }}>
        <span style={{ marginRight: '16px' }}>
          Owner: {repository.owner ? repository.owner.username : 'Unknown'}
        </span>
      </div>
    </div>
  );
}

export default RepositoryCard;