import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';

// Mock the auth API so we can simulate a stale/invalid refresh token: me() rejects
// (the 401 interceptor would have tried /v1/auth/refresh and failed).
const meMock = vi.fn();
vi.mock('../lib/api/coverones', () => ({
  authApi: {
    me: (...args: unknown[]) => meMock(...args),
  },
}));

const REFRESH_KEY = 'coverones_refresh_token';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute — stale-token open-page path', () => {
  beforeEach(() => {
    meMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrating: true,
    });
  });

  it('redirects to /login (no infinite spinner) when a stale refresh token fails to validate', async () => {
    // Simulate opening the app with a stale refresh token in localStorage.
    localStorage.setItem(REFRESH_KEY, 'stale-refresh-token');
    useAuthStore.setState({ refreshToken: 'stale-refresh-token', isHydrating: true });
    // me() rejects: the interceptor's refresh attempt failed (token invalid).
    meMock.mockRejectedValueOnce(new Error('401 invalid token'));

    renderApp();

    // Must land on /login — not stay stuck on the loading spinner.
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Stale token has been cleared and hydrating has stopped.
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(useAuthStore.getState().isHydrating).toBe(false);
  });

  it('redirects straight to /login when both tokens are null (never hydrates)', () => {
    renderApp();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    // me() must not be called — there is no token to validate.
    expect(meMock).not.toHaveBeenCalled();
  });

  it('renders protected content when a valid token hydrates the user', async () => {
    localStorage.setItem(REFRESH_KEY, 'valid-refresh-token');
    useAuthStore.setState({ refreshToken: 'valid-refresh-token', isHydrating: true });
    meMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Tester',
      avatarUrl: null,
      accountType: 'PERSONAL',
      kycTier: 0,
      status: 'ACTIVE',
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
