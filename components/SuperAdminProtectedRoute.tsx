import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';

export default function SuperAdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, user } = useAuth();
  const { loading: profileLoading, isSuperAdmin, profile } = useProfile();
  const location = useLocation();

  const stillLoading = authLoading || (!profile && profileLoading);
  if (stillLoading) return null;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}
