import React, { useState } from 'react';
import api from '../../utils/api';

function CommentForm({ codeId, onCommentAdded }) {
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/comments', { codeId, comment });
      setComment('');
      onCommentAdded(); // Refresh the comment list
    } catch (error) {
      alert('Error adding comment');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Add a comment..." 
        value={comment} 
        onChange={(e)=> setComment(e.target.value)}
        required 
      />
      <button type="submit">Post</button>
    </form>
  );
}

export default CommentForm;
