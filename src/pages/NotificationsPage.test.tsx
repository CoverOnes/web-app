/**
 * NotificationsPage tests.
 *
 * Cases:
 *   render:      loading skeleton, error state, empty list, notification list
 *   interaction: tab filter changes displayed items, mark-all-read button disabled when 0 unread
 *   error:       mark-all-read error shows alert
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import NotificationsPage from './NotificationsPage';
import { useAuthStore } from '../store/authStore';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../lib/query';
import type { Notification, ListNotificationsResponse, UnreadCountResponse } from '../lib/api/coverones';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../lib/query', () => ({
  useNotifications: vi.fn(),
  useUnreadCount: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useMarkNotificationRead: vi.fn(),
}));

// notificationApi is mocked to prevent real HTTP calls from test helpers.
vi.mock('../lib/api/coverones', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api/coverones')>();
  return {
    ...actual,
    notificationApi: {
      ...actual.notificationApi,
      markRead: vi.fn().mockResolvedValue(undefined),
      markAllRead: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const mockUseNotifications = vi.mocked(useNotifications);
const mockUseUnreadCount = vi.mocked(useUnreadCount);
const mockUseMarkAllNotificationsRead = vi.mocked(useMarkAllNotificationsRead);
const mockUseMarkNotificationRead = vi.mocked(useMarkNotificationRead);

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'KYC_TIER_CHANGED',
    title: '您的 KYC 認證已通過',
    body: 'KYC tier changed.',
    readAt: null,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeQueryResult<T>(data: T | undefined, overrides: object = {}): any {
  return {
    data,
    isLoading: false,
    isError: false,
    isPending: false,
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMutationResult(overrides: object = {}): any {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('NotificationsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'tok',
      refreshToken: 'ref',
      user: {
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        accountType: 'PERSONAL',
        kycTier: 2,
        status: 'ACTIVE',
        emailVerified: true,
      },
      isAuthenticated: true,
      isHydrating: false,
    });

    mockUseMarkAllNotificationsRead.mockReturnValue(makeMutationResult());
    mockUseMarkNotificationRead.mockReturnValue(makeMutationResult());
    mockUseUnreadCount.mockReturnValue(
      makeQueryResult<UnreadCountResponse>({ count: 0 })
    );
  });

  // ── render: loading ──────────────────────────────────────────────────────────

  it('(render-1) shows loading skeleton while fetching', () => {
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>(undefined, { isLoading: true })
    );

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    const busy = screen.getByLabelText('載入中');
    expect(busy).toBeTruthy();
  });

  // ── render: error ────────────────────────────────────────────────────────────

  it('(render-2) shows error empty-state on API failure', () => {
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>(undefined, { isError: true, isLoading: false })
    );

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    expect(screen.getByText('載入失敗')).toBeTruthy();
    expect(screen.getByText(/無法取得通知/)).toBeTruthy();
  });

  // ── render: empty list ───────────────────────────────────────────────────────

  it('(render-3) shows empty-state when API returns empty list', () => {
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({ items: [] })
    );

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    expect(screen.getByText('目前沒有通知')).toBeTruthy();
  });

  // ── render: notification rows ────────────────────────────────────────────────

  it('(render-4) renders notification rows from real API data', () => {
    const items: Notification[] = [
      makeNotification({ id: 'n1', title: '您的 KYC 認證已通過', type: 'KYC_TIER_CHANGED', readAt: null }),
      makeNotification({ id: 'n2', title: '新投標通知', type: 'BID_RECEIVED', readAt: '2026-01-01T00:00:00Z' }),
    ];
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({ items })
    );
    mockUseUnreadCount.mockReturnValue(makeQueryResult<UnreadCountResponse>({ count: 1 }));

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    expect(screen.getByText('您的 KYC 認證已通過')).toBeTruthy();
    expect(screen.getByText('新投標通知')).toBeTruthy();
    // Header count
    expect(screen.getByText(/2 則/)).toBeTruthy();
    expect(screen.getByText(/1 未讀/)).toBeTruthy();
  });

  // ── interaction: tab filtering ───────────────────────────────────────────────

  it('(interaction-1) 未讀 tab shows only unread items', async () => {
    const user = userEvent.setup();
    const items: Notification[] = [
      makeNotification({ id: 'n1', title: '未讀通知', type: 'KYC_TIER_CHANGED', readAt: null }),
      makeNotification({ id: 'n2', title: '已讀通知', type: 'BID_RECEIVED', readAt: '2026-01-01T00:00:00Z' }),
    ];
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({ items })
    );
    mockUseUnreadCount.mockReturnValue(makeQueryResult<UnreadCountResponse>({ count: 1 }));

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    await user.click(screen.getByRole('button', { name: '篩選：未讀' }));

    await waitFor(() => {
      expect(screen.getByText('未讀通知')).toBeTruthy();
      expect(screen.queryByText('已讀通知')).toBeNull();
    });
  });

  it('(interaction-2) 合約 tab shows empty-state when no contract notifications', async () => {
    const user = userEvent.setup();
    const items: Notification[] = [
      makeNotification({ id: 'n1', title: '投標通知', type: 'BID_RECEIVED', readAt: null }),
    ];
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({ items })
    );

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    await user.click(screen.getByRole('button', { name: '篩選：合約' }));

    await waitFor(() => {
      expect(screen.getByText(/沒有「合約」通知/)).toBeTruthy();
    });
  });

  // ── interaction: mark-all-read button state ───────────────────────────────────

  it('(interaction-3) mark-all-read button is disabled when no unread', () => {
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({
        items: [makeNotification({ id: 'n1', readAt: '2026-01-01T00:00:00Z' })],
      })
    );
    mockUseUnreadCount.mockReturnValue(makeQueryResult<UnreadCountResponse>({ count: 0 }));

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    expect(screen.getByRole('button', { name: '全部標為已讀' })).toBeDisabled();
  });

  it('(interaction-4) mark-all-read button enabled and calls mutate when unread > 0', async () => {
    const user = userEvent.setup();
    const mutateMock = vi.fn();
    mockUseMarkAllNotificationsRead.mockReturnValue(makeMutationResult({ mutate: mutateMock }));
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({
        items: [makeNotification({ readAt: null })],
      })
    );
    mockUseUnreadCount.mockReturnValue(makeQueryResult<UnreadCountResponse>({ count: 1 }));

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    const btn = screen.getByRole('button', { name: '全部標為已讀' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(mutateMock).toHaveBeenCalledOnce();
  });

  // ── error: mark-all-read failure ─────────────────────────────────────────────

  it('(error-1) shows alert when mark-all-read mutation errors', () => {
    mockUseMarkAllNotificationsRead.mockReturnValue(
      makeMutationResult({ isError: true })
    );
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({
        items: [makeNotification({ readAt: null })],
      })
    );
    mockUseUnreadCount.mockReturnValue(makeQueryResult<UnreadCountResponse>({ count: 1 }));

    render(<NotificationsPage />, { wrapper: makeWrapper() });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/操作失敗/)).toBeTruthy();
  });
});
