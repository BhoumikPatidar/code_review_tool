import React from 'react';
import CodeItem from './CodeItem';

function CodeList({ codes }) {
  return (
    <div>
      <h3>Code Submissions</h3>
      {codes.map((code) => (
        <CodeItem key={code._id} code={code} />
      ))}
    </div>
  );
}

export default CodeList;
