import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRepositoryForm from '../components/Repository/CreateRepositoryForm';

function CreateRepository() {
  const navigate = useNavigate();

  const handleRepositoryCreated = () => {
    // Redirect to the repository dashboard after successful creation
    navigate('/repositories');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <CreateRepositoryForm onRepositoryCreated={handleRepositoryCreated} />
    </div>
  );
}

export default CreateRepository;