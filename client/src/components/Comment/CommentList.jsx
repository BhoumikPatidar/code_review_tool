import React from 'react';

function CommentList({ comments }) {
  return (
    <div>
      <h5>Comments:</h5>
      {comments.map(comment => (
        <div key={comment._id} style={{ border: '1px solid #eee', padding: '0.5rem', margin: '0.5rem 0' }}>
          <p>{comment.comment}</p>
          <small>By: {comment.author?.username}</small>
        </div>
      ))}
    </div>
  );
}

export default CommentList;
