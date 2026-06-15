/**
 * OAuthCallback.test.tsx
 *
 * Covers: code exchange (login), email_exists error UX, generic error fallback,
 * and bind=success flow. Uses getByRole / getByText per project conventions
 * (no getByTestId).
 *
 * This test suite matches the main-branch OAuthCallback implementation which
 * uses ?code= (not #refresh_token=) for the success flow, and relies on
 * useQueryClient (wrapped in QueryClientProvider).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OAuthCallback from './OAuthCallback';
import { useAuthStore } from '../store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../lib/api/coverones', () => ({
  authApi: {
    oauthExchange: vi.fn(),
    oauthRegister: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from '../lib/api/coverones';
const mockExchange = vi.mocked(authApi.oauthExchange);
const mockMe = vi.mocked(authApi.me);

function renderWithSearch(search: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { queryClient, ...render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
        <OAuthCallback />
      </MemoryRouter>
    </QueryClientProvider>,
  )};
}

const sampleUser = {
  id: 'u1', email: 'test@co.com', displayName: 'Test', avatarUrl: null,
  accountType: 'PERSONAL' as const, kycTier: 0, status: 'PENDING_VERIFICATION', emailVerified: false,
};

describe('OAuthCallback — success', () => {
  beforeEach(() => {
    mockExchange.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('exchanges the code, stores the session, and navigates to /jobs', async () => {
    mockExchange.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref', tokenType: 'Bearer' });
    mockMe.mockResolvedValue(sampleUser);

    renderWithSearch('?code=one-time-code');

    await waitFor(() => {
      expect(mockExchange).toHaveBeenCalledWith({ code: 'one-time-code' });
      expect(mockMe).toHaveBeenCalledWith('acc');
    });

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('acc');
      expect(state.refreshToken).toBe('ref');
      expect(state.isAuthenticated).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/jobs', { replace: true });
    });
  });

  it('shows a loading message while processing', () => {
    // Exchange never resolves (stays in processing state).
    mockExchange.mockReturnValue(new Promise(() => {}));

    renderWithSearch('?code=any');

    expect(screen.getByText('正在完成登入，請稍候…')).toBeInTheDocument();
  });
});

describe('OAuthCallback — never-auto-link email collision', () => {
  beforeEach(() => {
    mockExchange.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('shows the "log in with your existing method" message and does NOT log in', async () => {
    renderWithSearch('?error=email_exists');

    const heading = await screen.findByRole('heading', { name: /此 Email 已有帳號/i });
    expect(heading).toBeInTheDocument();
    // Critical: no token exchange / no login on the never-auto-link branch.
    expect(mockExchange).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByRole('link', { name: /返回密碼登入/i })).toBeInTheDocument();
  });

  it('shows a generic error message for unknown errors', async () => {
    renderWithSearch('?error=some_unknown_error');

    const heading = await screen.findByRole('heading', { name: /登入失敗/i });
    expect(heading).toBeInTheDocument();
    expect(mockExchange).not.toHaveBeenCalled();
  });
});

describe('OAuthCallback — exchange failure', () => {
  beforeEach(() => {
    mockExchange.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('shows an error when the code exchange fails', async () => {
    mockExchange.mockRejectedValue(new Error('exchange failed'));

    renderWithSearch('?code=bad-code');

    const heading = await screen.findByRole('heading', { name: /登入失敗/i });
    expect(heading).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('OAuthCallback — no code / no error', () => {
  it('shows an error when neither code nor error param is present', async () => {
    renderWithSearch('');

    const heading = await screen.findByRole('heading', { name: /登入失敗/i });
    expect(heading).toBeInTheDocument();
  });
});

describe('OAuthCallback — bind=success', () => {
  beforeEach(() => {
    mockExchange.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('invalidates the identities query cache and navigates to /settings', async () => {
    // Use fake timers only for setTimeout so waitFor (which uses setInterval/Promise)
    // is not affected. The shouldAdvanceTime option lets microtasks/promises resolve.
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Create the client before rendering so we can spy before the effect fires.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/callback?bind=success']}>
          <OAuthCallback />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // The component shows the "綁定成功" processing label immediately.
    expect(screen.getByText('綁定成功，正在跳轉…')).toBeInTheDocument();

    // The identities cache is invalidated synchronously in the useEffect.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me', 'identities'] });

    // No auth token exchange should occur for a bind flow.
    expect(mockExchange).not.toHaveBeenCalled();

    // After the 1500ms setTimeout, the component navigates to /settings.
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });

    vi.useRealTimers();
  });
});
