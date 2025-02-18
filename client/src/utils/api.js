import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.7.4.221:12345/api'
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
