import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useProfile } from '../hooks/useProfile';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading: authLoading, user, signOut } = useAuth();
  const { loading: profileLoading, isAdmin, profile } = useProfile();
  const location = useLocation();
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.email_confirmed_at) return;
    setBlocking(true);
    signOut().finally(() => setBlocking(false));
  }, [user, signOut]);

  // Wait until auth AND profile have both fully resolved
  const stillLoading = authLoading || profileLoading || blocking;

  // If user is logged in, don't redirect until profile has actually loaded
  const profileSettled = !profileLoading && (profile !== null || !user);

  if (stillLoading || !profileSettled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading admin permissions…</div>
      </div>
    );
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