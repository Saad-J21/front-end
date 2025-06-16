// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !hasRole('ROLE_ADMIN')) {
    // Logged in, but not an admin, redirect to products or a 403 page
    return <Navigate to="/products" replace />; // Or a dedicated /unauthorized page
  }

  return children; // User is authenticated and authorized
};

export default PrivateRoute;