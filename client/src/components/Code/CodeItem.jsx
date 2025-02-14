import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import CommentList from '../Comment/CommentList';
import CommentForm from '../Comment/CommentForm';

function CodeItem({ code }) {
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    try {
      // Use code.id instead of code._id
      const { data } = await api.get(`/comments/${code.id}`);
      setComments(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
      <h4>{code.title}</h4>
      <pre>{code.code}</pre>
      <p>Submitted by: {code.author?.username}</p>
      <CommentList comments={comments} />
      {/* Pass code.id here */}
      <CommentForm codeId={code.id} onCommentAdded={fetchComments} />
    </div>
  );
}

export default CodeItem;
