import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isHydrating, accessToken, logout, setUser, setHydrating } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setHydrating(false);
      return;
    }

    if (isAuthenticated) {
      setHydrating(false);
      return;
    }

    // Verify stored token and hydrate user (including fresh kycTier)
    authApi.me()
      .then((user) => {
        setUser(user);
        // Ensure isAuthenticated=true — login() sets it, setUser doesn't
        useAuthStore.setState({ isAuthenticated: true, isHydrating: false });
      })
      .catch(() => {
        logout();
        setHydrating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

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
