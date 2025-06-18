// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://36c8-2a02-ff0-3316-d1f1-5f3e-ca4d-b042-4bb9.ngrok-free.app/api', // This will proxy to http://localhost:8080/api thanks to package.json proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); // Get token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401/403 (optional, but good for robust apps)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // You might want to automatically redirect to login or show a session expired message
      console.log('Authentication or authorization error:', error.response.status);
      // For example, if 401 from protected route (not login failure itself), clear token and redirect
      // localStorage.removeItem('jwtToken');
      // window.location.href = '/login'; // Or use react-router-dom navigate
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
