import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isHydrating,
    accessToken,
    refreshToken,
    clearStaleSession,
    setUser,
    setHydrating,
  } = useAuthStore();

  // No session at all (no access token, no refresh token) → nothing to hydrate.
  // Stop hydrating immediately so we never render the boot spinner indefinitely.
  const hasNoSession = !accessToken && !refreshToken;

  useEffect(() => {
    // Case 1: completely logged out — never hydrate, go straight to /login.
    if (hasNoSession) {
      setHydrating(false);
      return;
    }

    // Case 2: already authenticated in memory — done.
    if (isAuthenticated) {
      setHydrating(false);
      return;
    }

    // Case 3: we have a token (access and/or a persisted refresh token from a
    // previous session). Validate it by hydrating the user. If the access token
    // is missing/expired, the 401 interceptor will attempt a /v1/auth/refresh
    // using the stored refresh token. If THAT fails (stale/invalid refresh
    // token), me() rejects → we must clear the stale session and stop hydrating
    // so the user is sent to /login instead of hanging on the spinner forever.
    authApi
      .me()
      .then((user) => {
        setUser(user);
        // setUser already sets isAuthenticated; only isHydrating needs an explicit reset here.
        useAuthStore.setState({ isHydrating: false });
      })
      .catch(() => {
        // Stale/invalid token: wipe it and bail out of hydrating.
        clearStaleSession();
      });
  // accessToken + refreshToken drive whether a session exists to validate.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshToken]);

  // Both tokens null → no point showing the spinner; redirect immediately.
  if (hasNoSession) {
    return <Navigate to="/login" replace />;
  }

  if (isHydrating) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--co-bg)',
          color: 'var(--co-text-dim)',
          fontSize: 14,
          gap: 12,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--color-accent)',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }}
          aria-hidden="true"
        />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
