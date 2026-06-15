/**
 * UnverifiedBanner tests
 *
 * Coverage:
 *   1. Cooldown: starts at 60 s after resend success; ticks each second; re-enables at 0.
 *   2. sessionStorage.removeItem called when emailVerified flips to true.
 *   3. Dismiss sets the sessionStorage key + hides the banner.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnverifiedBanner } from './UnverifiedBanner';
import { useAuthStore, type AuthUser } from '../../store/authStore';
import { useResendVerification } from '../../lib/query';

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('../../lib/query', () => ({
  useResendVerification: vi.fn(),
}));

const mockUseResend = vi.mocked(useResendVerification);

// ─── Fixtures ─────────────────────────────────────────────────────────────

const unverifiedUser: AuthUser = {
  id: 'u1',
  email: 'unverified@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 0,
  status: 'ACTIVE',
  emailVerified: false,
};

function setUnverifiedAuth() {
  useAuthStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: unverifiedUser,
    isAuthenticated: true,
    isHydrating: false,
  });
}

function renderBanner() {
  return render(<UnverifiedBanner />);
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('UnverifiedBanner — cooldown countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    setUnverifiedAuth();
    mockUseResend.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useResendVerification>);
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('shows "重寄驗證信" label initially', () => {
    renderBanner();
    expect(screen.getByRole('button', { name: '重寄驗證信' })).toBeInTheDocument();
  });

  it('starts 60 s countdown after successful resend', async () => {
    renderBanner();

    // fireEvent avoids the userEvent pointer-event async chain that blocks
    // under vi.useFakeTimers() + Promise resolution.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '重寄驗證信' }));
    });

    // After mutateAsync resolves, startCooldown fires; button text shows "60s 後重試"
    // Query by text content since aria-label uses Chinese "後" which may differ from regex
    const resendBtn = screen.getByRole('button', { name: '60 秒後可重試' });
    expect(resendBtn).toBeInTheDocument();
  });

  it('decrements cooldown each second', async () => {
    renderBanner();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '重寄驗證信' }));
    });

    // Advance 3 interval ticks: 60 → 59 → 58 → 57
    act(() => { vi.advanceTimersByTime(3000); });

    // aria-label becomes "57 秒後可重試", textContent becomes "57s 後重試"
    const btn = screen.getByRole('button', { name: '57 秒後可重試' });
    expect(btn.textContent).toBe('57s 後重試');
  });

  it('re-enables the button after the full 60 s cooldown', async () => {
    renderBanner();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '重寄驗證信' }));
    });

    // Run through all 60 interval ticks to exhaustion
    act(() => { vi.advanceTimersByTime(60_000); });

    // Cooldown null → label reverts to idle state
    expect(screen.getByRole('button', { name: '重寄驗證信' })).toBeInTheDocument();
  });
});

describe('UnverifiedBanner — sessionStorage.removeItem on verify', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockUseResend.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useResendVerification>);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('removes DISMISS_KEY from sessionStorage when emailVerified flips to true', async () => {
    // Pre-seed the dismiss key to simulate a user who dismissed the banner
    // before verifying their email.
    sessionStorage.setItem('coverones_unverified_banner_dismissed', '1');

    // Render with unverified user
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: unverifiedUser,
      isAuthenticated: true,
      isHydrating: false,
    });

    renderBanner();

    // Simulate backend confirming email verification → flip in store
    act(() => {
      useAuthStore.setState({
        user: { ...unverifiedUser, emailVerified: true },
      });
    });

    // The dismiss key must be removed so a future session is not stale-dismissed.
    await waitFor(() => {
      expect(sessionStorage.getItem('coverones_unverified_banner_dismissed')).toBeNull();
    });
  });
});

describe('UnverifiedBanner — dismiss behaviour', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setUnverifiedAuth();
    mockUseResend.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useResendVerification>);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('sets the sessionStorage dismiss key when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: '關閉提醒' }));

    expect(sessionStorage.getItem('coverones_unverified_banner_dismissed')).toBe('1');
  });

  it('hides the banner after dismiss', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: '關閉提醒' }));

    // Banner should no longer be in the DOM
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when the session dismiss key is already set', () => {
    sessionStorage.setItem('coverones_unverified_banner_dismissed', '1');
    renderBanner();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
