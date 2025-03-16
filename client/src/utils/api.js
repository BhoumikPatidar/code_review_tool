import axios from 'axios';

// Get the GitHub Codespace URL from the window location
const isCodespace = window.location.hostname.includes('.app.github.dev');
// const baseURL = isCodespace 
//   ? `https://${window.location.hostname.replace('5173', '80')}/api`
//   : 'http://127.0.0.1:80/api';

const baseURL = 'http://3.82.96.157:5000/api';

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
