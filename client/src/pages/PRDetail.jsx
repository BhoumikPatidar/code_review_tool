// src/pages/PRDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

function PRDetail() {
  const { id } = useParams(); // PR ID from the URL
  const [pr, setPr] = useState(null);
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState('');
  const [prComments, setPrComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch PR details
  useEffect(() => {
    const fetchPR = async () => {
      try {
        const { data } = await api.get(`/prs/${id}`);
        setPr(data);
      } catch (err) {
        console.error(err);
        setError('Error fetching PR details');
      }
    };
    fetchPR();
  }, [id]);

  // Fetch commit history for the repository from the source branch
  useEffect(() => {
    if (pr && pr.repository && pr.sourceBranch) {
      const fetchCommits = async () => {
        try {
          const { data } = await api.get(`/repos/${pr.repository}/commits`);
          setCommits(data.commits);
        } catch (err) {
          console.error(err);
          setError('Error fetching commit history');
        }
      };
      fetchCommits();
    }
  }, [pr]);

  // Fetch PR comments
  const fetchPRComments = async () => {
    try {
      const { data } = await api.get(`/prcomments/${id}`);
      setPrComments(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching PR comments');
    }
  };

  useEffect(() => {
    if (pr) {
      fetchPRComments();
    }
  }, [pr]);

  // Fetch diff for a selected commit
  const handleCommitClick = async (commitSha) => {
    setSelectedCommit(commitSha);
    setLoadingDiff(true);
    setDiff(null);
    try {
      const { data } = await api.get(`/repos/${pr.repository}/diff/${commitSha}`);
      setDiff(data.diffs);
    } catch (err) {
      console.error(err);
      setError('Error fetching diff for commit');
    }
    setLoadingDiff(false);
  };

  // Handle posting a new PR comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prcomments', { prId: pr.id, comment: newComment });
      setNewComment('');
      fetchPRComments();
    } catch (err) {
      console.error(err);
      setError('Error posting comment');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Pull Request Details</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {pr ? (
        <div>
          <h3>{pr.title}</h3>
          <p>{pr.description}</p>
          <p>
            <strong>Repository:</strong> {pr.repository}
          </p>
          <p>
            <strong>Source Branch:</strong> {pr.sourceBranch} | <strong>Target Branch:</strong> {pr.targetBranch}
          </p>
          <p>
            <strong>Status:</strong> {pr.status}
          </p>
          <hr />
          <h3>Commit History (Source Branch)</h3>
          {commits.length === 0 ? (
            <p>No commits found.</p>
          ) : (
            <ul>
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <button onClick={() => handleCommitClick(commit.sha)}>
                    {commit.sha.substring(0, 7)} - {commit.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loadingDiff && <p>Loading diff...</p>}
          {diff && (
            <div>
              <h3>Diff for Commit {selectedCommit}</h3>
              {diff.map((d, index) => (
                <div key={index} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '0.5rem' }}>
                  <p><strong>File:</strong> {d.file}</p>
                  <p><strong>Status:</strong> {d.status}</p>
                  <p>
                    <strong>Additions:</strong> {d.additions} &nbsp; <strong>Deletions:</strong> {d.deletions}
                  </p>
                </div>
              ))}
            </div>
          )}

          <hr />
          <h3>PR Comments</h3>
          {prComments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            <ul>
              {prComments.map((c) => (
                <li key={c.id}>
                  <p>{c.comment}</p>
                  <small>By: {c.author?.username}</small>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handlePostComment}>
            <textarea
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="3"
              cols="50"
              required
            />
            <br />
            <button type="submit">Post Comment</button>
          </form>
        </div>
      ) : (
        <p>Loading PR details...</p>
      )}
    </div>
  );
}

export default PRDetail;
