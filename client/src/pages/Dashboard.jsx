import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import CodeEditor from '../components/Code/CodeEditor';
import CodeList from '../components/Code/CodeList';

function Dashboard() {
  const [codes, setCodes] = useState([]);

  const fetchCodes = async () => {
    try {
      const { data } = await api.get('/codes');
      setCodes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Dashboard</h2>
      <CodeEditor onCodeCreated={fetchCodes} />
      <CodeList codes={codes} />
    </div>
  );
}

export default Dashboard;
