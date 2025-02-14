// src/components/Code/CodeEditor.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../utils/api';

function CodeEditor({ onCodeCreated }) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('// Write your code here...');

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/codes', { title, code });
      setTitle('');
      setCode('// Write your code here...');
      onCodeCreated(); // refresh code list in Dashboard
    } catch (error) {
      alert('Error creating code snippet');
    }
  };

  return (
    // Container for the entire editor form
    <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h3>Create New Code</h3>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '1rem',
            fontSize: '1rem'
          }}
          required
        />
        {/* Editor container with increased height and full width */}
        <div style={{ height: '600px', width: '100%' }}>
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
          />
        </div>
        <button type="submit" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Submit Code
        </button>
      </form>
    </div>
  );
}

export default CodeEditor;
