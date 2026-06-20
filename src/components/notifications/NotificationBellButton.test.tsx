/**
 * NotificationBellButton tests.
 *
 * Cases:
 *   render:      renders bell button, shows red dot badge when unread > 0
 *   interaction: dropdown opens on click, closes on second click,
 *                markRead called on row click (and dropdown closes)
 *   error:       (loading skeleton visible while isLoading)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import NotificationBellButton from './NotificationBellButton';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../lib/query';
import type {
  Notification,
  ListNotificationsResponse,
  UnreadCountResponse,
} from '../../lib/api/coverones';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../lib/query', () => ({
  useNotifications: vi.fn(),
  useUnreadCount: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
}));

const mockUseNotifications = vi.mocked(useNotifications);
const mockUseUnreadCount = vi.mocked(useUnreadCount);
const mockUseMarkNotificationRead = vi.mocked(useMarkNotificationRead);
const mockUseMarkAllNotificationsRead = vi.mocked(useMarkAllNotificationsRead);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeQueryResult<T>(data: T | undefined, overrides: object = {}): any {
  return { data, isLoading: false, isError: false, isPending: false, ...overrides };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMutationResult(overrides: object = {}): any {
  return { mutate: vi.fn(), isPending: false, isError: false, ...overrides };
}

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'KYC_TIER_CHANGED',
    title: 'KYC 已通過',
    body: 'KYC body',
    readAt: null,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('NotificationBellButton', () => {
  beforeEach(() => {
    mockUseMarkNotificationRead.mockReturnValue(makeMutationResult());
    mockUseMarkAllNotificationsRead.mockReturnValue(makeMutationResult());
    mockUseUnreadCount.mockReturnValue(
      makeQueryResult<UnreadCountResponse>({ count: 0 })
    );
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({ items: [] })
    );
  });

  // ── render ──────────────────────────────────────────────────────────────────

  it('(render-1) renders the bell button with accessible label', () => {
    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    expect(screen.getByRole('button', { name: '通知' })).toBeTruthy();
  });

  it('(render-2) shows aria-label with count when unread > 0', () => {
    mockUseUnreadCount.mockReturnValue(
      makeQueryResult<UnreadCountResponse>({ count: 3 })
    );

    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    expect(screen.getByRole('button', { name: '3 則未讀通知' })).toBeTruthy();
  });

  it('(render-3) shows loading skeleton while fetching notifications', async () => {
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>(undefined, { isLoading: true })
    );

    const user = userEvent.setup();
    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    // Open the dropdown first
    await user.click(screen.getByRole('button', { name: '通知' }));

    // LoadingSkeleton renders aria-hidden divs (no accessible label);
    // verify the dropdown is open and the empty-state text is NOT present
    // (skeleton is showing instead of empty-state or rows)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      // "目前沒有通知" (empty state) must NOT appear while loading
      expect(screen.queryByText('目前沒有通知')).toBeNull();
    });
  });

  // ── interaction ─────────────────────────────────────────────────────────────

  it('(interaction-1) dropdown opens when bell button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    // Dropdown not visible initially
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: '通知' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('通知')).toBeTruthy();
  });

  it('(interaction-2) dropdown closes when bell button is clicked again', async () => {
    const user = userEvent.setup();
    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    const bell = screen.getByRole('button', { name: '通知' });

    await user.click(bell); // open
    expect(screen.getByRole('dialog')).toBeTruthy();

    await user.click(bell); // close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('(interaction-3) clicking a notification row calls markRead and closes dropdown', async () => {
    const markReadMutate = vi.fn();
    mockUseMarkNotificationRead.mockReturnValue(
      makeMutationResult({ mutate: markReadMutate })
    );
    mockUseNotifications.mockReturnValue(
      makeQueryResult<ListNotificationsResponse>({
        items: [makeNotification({ id: 'n42', title: '點我', readAt: null })],
      })
    );
    mockUseUnreadCount.mockReturnValue(
      makeQueryResult<UnreadCountResponse>({ count: 1 })
    );

    const user = userEvent.setup();
    render(<NotificationBellButton />, { wrapper: makeWrapper() });

    // Open dropdown
    await user.click(screen.getByRole('button', { name: '1 則未讀通知' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    // Click notification row
    await user.click(screen.getByRole('button', { name: /點我/ }));

    // markRead called with notification id
    expect(markReadMutate).toHaveBeenCalledWith('n42');

    // Dropdown closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
