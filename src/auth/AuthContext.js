// src/auth/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient'; // Import your axios client

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores { id, username, email, roles }
  const [loading, setLoading] = useState(true); // To check if initial token is being validated

  useEffect(() => {
    // Attempt to load user from stored token on app start
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      // In a real app, you'd send this token to a backend /me endpoint
      // to validate it and get user details. For simplicity, we'll just parse it (less secure).
      // Or, immediately after login, you get full user details.
      // For now, we'll just assume existence of token means "logged in" for initial load
      // And actual user details come from login response or /me endpoint later.
      const storedUser = JSON.parse(localStorage.getItem('user')); // Assuming you store user details
      if (storedUser) {
        setUser(storedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      const { token, id, email, roles } = response.data; // Destructure response from backend

      localStorage.setItem('jwtToken', token);
      const userData = { id, username, email, roles };
      localStorage.setItem('user', JSON.stringify(userData)); // Store user details
      setUser(userData);
      return true; // Login successful
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      throw error; // Re-throw to handle in component
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Helper to check if user has a specific role
  const hasRole = (roleName) => {
    return user && user.roles && user.roles.includes(roleName);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};