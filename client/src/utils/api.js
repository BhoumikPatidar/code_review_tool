import axios from 'axios';

// Get the GitHub Codespace URL from the window location
const isCodespace = window.location.hostname.includes('.app.github.dev');
const baseURL = isCodespace 
  ? `https://${window.location.hostname.replace('5173', '12345')}/api`
  : 'http://10.7.4.221:12345/api';

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