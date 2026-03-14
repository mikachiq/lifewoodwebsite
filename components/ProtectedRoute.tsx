import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user, signOut } = useAuth();
  const location = useLocation();
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.email_confirmed_at) return;

    setBlocking(true);
    signOut().finally(() => setBlocking(false));
  }, [user, signOut]);

  if (loading || blocking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm font-bold text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/login" replace state={{ message: 'Please verify your email before continuing.' }} />;
  }

  return <>{children}</>;
}

