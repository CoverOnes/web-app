import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const REFRESH_KEY = 'coverones_refresh_token';

describe('authStore — stale token handling', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrating: true,
    });
  });

  it('clearStaleSession removes the persisted refresh token', () => {
    localStorage.setItem(REFRESH_KEY, 'stale-refresh-token');
    useAuthStore.setState({ refreshToken: 'stale-refresh-token', isAuthenticated: true });

    useAuthStore.getState().clearStaleSession();

    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clearStaleSession stops hydrating so the app never hangs on the spinner', () => {
    useAuthStore.setState({ isHydrating: true });

    useAuthStore.getState().clearStaleSession();

    expect(useAuthStore.getState().isHydrating).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
