import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, user, signOut } = useAuth();
  const { loading: profileLoading, isAdmin, profile } = useProfile();
  const location = useLocation();
  const [blocking, setBlocking] = useState(false);
  const hasResolvedAdminProfile = Boolean(user && profile?.id === user.id && isAdmin);

  useEffect(() => {
    if (!user) return;
    if (user.email_confirmed_at) return;
    setBlocking(true);
    signOut().finally(() => setBlocking(false));
  }, [user, signOut]);

  const stillLoading = authLoading || blocking || (!hasResolvedAdminProfile && profileLoading);
  const profileSettled = hasResolvedAdminProfile || (!profileLoading && (profile !== null || !user));

  if (stillLoading || !profileSettled) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/login" replace state={{ message: 'Please verify your email before continuing.' }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
