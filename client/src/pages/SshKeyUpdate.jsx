// src/pages/SshKeyUpdate.jsx
import React, { useState } from 'react';
import api from '../utils/api';

function SshKeyUpdate() {
  const [publicKey, setPublicKey] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/user/sshkey', { publicKey });
      setMessage(data.message);
    } catch (error) {
      console.error("Error updating SSH key:", error);
      setMessage(error.response?.data?.error || "Error updating SSH key");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Update Your SSH Public Key</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleUpdate}>
        <textarea
          placeholder="Paste your SSH public key here"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          rows="4"
          cols="50"
          required
        />
        <br />
        <button type="submit">Update SSH Key</button>
      </form>
    </div>
  );
}

export default SshKeyUpdate;
