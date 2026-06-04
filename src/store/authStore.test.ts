import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type AuthUser } from './authStore';

const REFRESH_KEY = 'coverones_refresh_token';

const mockUser: AuthUser = {
  id: 'u1',
  email: 'a@example.com',
  displayName: 'Tester',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 0,
  status: 'PENDING_VERIFICATION',
  emailVerified: false,
};

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

describe('authStore — email verification (Increment 1)', () => {
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

  it('setEmailVerified flips the flag on the current user', () => {
    useAuthStore.setState({ user: { ...mockUser, emailVerified: false } });

    useAuthStore.getState().setEmailVerified(true);

    expect(useAuthStore.getState().user?.emailVerified).toBe(true);
  });

  it('setEmailVerified is a no-op when there is no user (does not crash)', () => {
    useAuthStore.setState({ user: null });

    expect(() => useAuthStore.getState().setEmailVerified(true)).not.toThrow();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setEmailVerified can mark a user unverified (e.g. after a 403 EMAIL_NOT_VERIFIED)', () => {
    useAuthStore.setState({ user: { ...mockUser, emailVerified: true } });

    useAuthStore.getState().setEmailVerified(false);

    expect(useAuthStore.getState().user?.emailVerified).toBe(false);
  });
});
