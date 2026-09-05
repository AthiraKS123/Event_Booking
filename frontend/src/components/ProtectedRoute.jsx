import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ currentUser, requireAdmin = false, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
