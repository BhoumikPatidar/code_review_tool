import axios from 'axios';

const baseURL = 'http://44.212.70.6:5000/api';

const api = axios.create({
  baseURL: baseURL
});

// Automatically attach JWT token (if exists) to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
