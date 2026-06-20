/**
 * useNewNotificationToast tests.
 *
 * Cases:
 *   render:      no toast fires on mount even when unread count > 0 (spurious-toast prevention)
 *   interaction: toast fires when count increases after baseline is established,
 *                no toast when pathname is /notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNewNotificationToast } from './useNewNotificationToast';
import { useToast, __resetToasts } from '../components/notifications/useToast';
import { useUnreadCount } from '../lib/query';
import type { UnreadCountResponse } from '../lib/api/coverones';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../lib/query', () => ({
  useUnreadCount: vi.fn(),
}));

// Control useLocation pathname per test
let _mockPathname = '/dashboard';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: () => ({ pathname: _mockPathname }),
  };
});

const mockUseUnreadCount = vi.mocked(useUnreadCount);

// ── Helpers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUnreadResult(count: number | undefined): any {
  if (count === undefined) {
    return { data: undefined };
  }
  return { data: { count } satisfies UnreadCountResponse };
}

function makeWrapper(initialEntry = '/dashboard') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useNewNotificationToast', () => {
  beforeEach(() => {
    __resetToasts();
    _mockPathname = '/dashboard';
    mockUseUnreadCount.mockReturnValue(makeUnreadResult(undefined));
  });

  // ── render: no spurious toast on mount ────────────────────────────────────────

  it('(render-1) NO toast fires when data resolves from undefined with pre-existing unread', () => {
    // data starts as undefined (loading)
    mockUseUnreadCount.mockReturnValue(makeUnreadResult(undefined));

    const { result: toastResult, rerender } = renderHook(
      () => {
        useNewNotificationToast();
        return useToast();
      },
      { wrapper: makeWrapper() }
    );

    // Initially no toasts
    expect(toastResult.current.toasts).toHaveLength(0);

    // Data resolves with 5 pre-existing unread — this is the FIRST resolved value
    act(() => {
      mockUseUnreadCount.mockReturnValue(makeUnreadResult(5));
    });
    rerender();

    // MUST NOT toast — first resolved value seeds the baseline only
    expect(toastResult.current.toasts).toHaveLength(0);
  });

  // ── interaction: toast fires on subsequent increase ──────────────────────────

  it('(interaction-1) toast fires when count increases after baseline is established', () => {
    mockUseUnreadCount.mockReturnValue(makeUnreadResult(undefined));

    const { result: toastResult, rerender } = renderHook(
      () => {
        useNewNotificationToast();
        return useToast();
      },
      { wrapper: makeWrapper() }
    );

    // Establish baseline: first resolved value = 3 (no toast)
    act(() => {
      mockUseUnreadCount.mockReturnValue(makeUnreadResult(3));
    });
    rerender();
    expect(toastResult.current.toasts).toHaveLength(0);

    // Count increases from 3 → 5 (2 new notifications)
    act(() => {
      mockUseUnreadCount.mockReturnValue(makeUnreadResult(5));
    });
    rerender();

    expect(toastResult.current.toasts).toHaveLength(1);
    expect(toastResult.current.toasts[0].title).toBe('你有新通知');
    expect(toastResult.current.toasts[0].body).toBe('2 則未讀');
  });

  it('(interaction-2) NO toast when on /notifications page even if count increases', () => {
    _mockPathname = '/notifications';
    mockUseUnreadCount.mockReturnValue(makeUnreadResult(undefined));

    const { result: toastResult, rerender } = renderHook(
      () => {
        useNewNotificationToast();
        return useToast();
      },
      { wrapper: makeWrapper('/notifications') }
    );

    // Establish baseline
    act(() => {
      mockUseUnreadCount.mockReturnValue(makeUnreadResult(2));
    });
    rerender();
    expect(toastResult.current.toasts).toHaveLength(0);

    // Count increases, but we're on /notifications — no toast
    act(() => {
      mockUseUnreadCount.mockReturnValue(makeUnreadResult(4));
    });
    rerender();

    expect(toastResult.current.toasts).toHaveLength(0);
  });
});
