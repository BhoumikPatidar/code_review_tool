import axios from 'axios';

const baseURL = 'http://65.2.3.200:5000/api';

const api = axios.create({
  baseURL: baseURL
});

// Create a function to setup the token that can be called on login
export const setupAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initial setup from localStorage
const token = localStorage.getItem('token');
if (token) {
  setupAuthToken(token);
}

// Add response interceptor to handle 401 unauthorized globally
api.interceptors.response.use(
  response => response,
  error => {
    // If we get a 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      // Clear token and localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // This could be redirecting to login - let's change it to home
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;