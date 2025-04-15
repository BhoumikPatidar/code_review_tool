import axios from 'axios';

const baseURL = 'http://65.2.3.200:5000/api';

const api = axios.create({
  baseURL: 'http://65.2.3.200:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
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

api.interceptors.request.use(
  (config) => {
    console.log("\n=== API REQUEST START ===");
    console.log("Request URL:", config.url);
    console.log("Request method:", config.method);
    console.log("Request headers:", config.headers);
    console.log("=== API REQUEST END ===\n");
    return config;
  },
  (error) => {
    console.error("\n=== API REQUEST ERROR ===");
    console.error("Request failed:", error);
    console.error("=== API REQUEST ERROR END ===\n");
    return Promise.reject(error);
  }
);

// // Add response interceptor to handle 401 unauthorized globally
// api.interceptors.response.use(
//   response => response,
//   error => {
//     // If we get a 401 Unauthorized response
//     if (error.response && error.response.status === 401) {
//       // Clear token and localStorage
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       delete api.defaults.headers.common['Authorization'];
      
//       // This could be redirecting to login - let's change it to home
//       window.location.href = '/';
//     }
//     return Promise.reject(error);
//   }
// );
api.interceptors.response.use(
  (response) => {
    console.log("\n=== API RESPONSE START ===");
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Response data:", response.data);
    console.log("=== API RESPONSE END ===\n");
    return response;
  },
  (error) => {
    console.error("\n=== API RESPONSE ERROR ===");
    console.error("Response error:", error);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("=== API RESPONSE ERROR END ===\n");
    return Promise.reject(error);
  }
);

export default api;