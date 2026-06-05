/**
 * OAuthCallback.test.tsx
 *
 * Covers: success (stores tokens via authStore + navigates), new-user routing to
 * /kyc, the never-auto-link email_exists error UX, and generic error fallback.
 * Uses getByRole / getByText per project conventions (no getByTestId).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OAuthCallback from './OAuthCallback';
import { useAuthStore } from '../store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../lib/api/coverones', () => ({
  authApi: {
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from '../lib/api/coverones';
const mockRefresh = vi.mocked(authApi.refresh);
const mockMe = vi.mocked(authApi.me);

// Helper: drive the page with a given URL hash + search.
function setLocation(hash: string, search = '') {
  window.history.replaceState(null, '', `/oauth/callback${search}${hash}`);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OAuthCallback />
    </MemoryRouter>,
  );
}

const sampleUser = {
  id: 'u1', email: 'test@co.com', displayName: 'Test', avatarUrl: null,
  accountType: 'PERSONAL', kycTier: 0, status: 'PENDING_VERIFICATION', emailVerified: false,
};

describe('OAuthCallback — success', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  afterEach(() => {
    setLocation('', '');
  });

  it('exchanges the refresh token, stores the session, and navigates to the redirect', async () => {
    mockRefresh.mockResolvedValue({ accessToken: 'acc', refreshToken: 'newref' });
    mockMe.mockResolvedValue(sampleUser);
    setLocation('#refresh_token=rt-123&redirect=%2Fcontracts');

    renderPage();

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledWith('rt-123');
      expect(mockMe).toHaveBeenCalledWith('acc');
    });

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('acc');
      expect(state.refreshToken).toBe('newref');
      expect(state.isAuthenticated).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/contracts', { replace: true });
    });
  });

  it('routes a new social user (new=1) into the KYC flow', async () => {
    mockRefresh.mockResolvedValue({ accessToken: 'acc', refreshToken: 'newref' });
    mockMe.mockResolvedValue(sampleUser);
    setLocation('#refresh_token=rt-123&redirect=%2Fjobs&new=1');

    renderPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/kyc', { replace: true });
    });
  });
});

describe('OAuthCallback — never-auto-link email collision', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  afterEach(() => setLocation('', ''));

  it('shows the "log in with your existing method" message and does NOT log in', async () => {
    setLocation('', '?oauth_error=email_exists&provider=google&email=j***%40e***.com');

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('已有 CoverOnes 帳號');
    expect(alert).toHaveTextContent('設定 → 社群帳號綁定');
    expect(alert).toHaveTextContent('Google');
    // Critical: no token exchange / no login on the never-auto-link branch.
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByRole('button', { name: '前往登入' })).toBeInTheDocument();
  });

  it('shows a generic verification-failed message for unknown errors', async () => {
    setLocation('', '?oauth_error=verification_failed');

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('登入驗證失敗');
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe('OAuthCallback — exchange failure', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  afterEach(() => setLocation('', ''));

  it('clears the session and shows an error when the token exchange fails', async () => {
    mockRefresh.mockRejectedValue(new Error('refresh failed'));
    setLocation('#refresh_token=rt-bad');

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('登入驗證失敗');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
