import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    // If a specific role is required, check if user has it
    if (requiredRole && userRole !== requiredRole) {
      // Redirect user to their appropriate dashboard
      if (userRole === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (userRole === 'franchise') {
        return <Navigate to="/franchise" replace />;
      } else {
        // For any other role or invalid role, send to login
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
      }
    }

    return children;
  } catch (error) {
    // Invalid token
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
