/**
 * MessageList tests
 *
 * Coverage:
 *   render-1: renders loading state (load-more banner not visible during load)
 *   render-2: shows "載入中..." while initial fetch is pending
 *   render-3: shows load-more banner after successful load and store hasMore=true
 *   error-1:  shows error state and retry button on initial load failure
 *
 * Note: @tanstack/react-virtual cannot measure DOM in jsdom (offsetHeight=0),
 * so virtual item rendering is stubbed by ensuring the relevant DOM paths
 * (loading / error early returns) are reachable without virtualizer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import type { Message } from '../../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/chat', () => ({
  chatApi: {
    getMessages: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

const mockGetMessages = vi.mocked(chatApi.getMessages);

// Minimal mock for EncryptionNotice / DaySeparator / MessageGroup so we don't
// pull in heavy deps during unit tests.
vi.mock('./EncryptionNotice', () => ({
  default: () => <div data-testid="encryption-notice" />,
}));

vi.mock('./DaySeparator', () => ({
  default: ({ label }: { label: string }) => <div data-testid="day-separator">{label}</div>,
}));

vi.mock('./MessageGroup', () => ({
  default: ({ messages }: { messages: Message[] }) => (
    <div data-testid="message-group">{messages.map(m => <span key={m.id}>{m.content}</span>)}</div>
  ),
}));

// Stub @tanstack/react-virtual so tests don't rely on real DOM measurements.
// The stub renders all virtual items (by index) so assertions can inspect the DOM.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: i,
        start: i * 40,
        size: 40,
        lane: 0,
      })),
    getTotalSize: () => count * 40,
    measureElement: () => {},
    scrollToIndex: () => {},
  }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-001',
    room_id: 'room-1',
    sender_id: 'user-1',
    content: 'Hello',
    type: 'text',
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MessageList', () => {
  const ROOM_ID = 'room-1';

  beforeEach(() => {
    // Set auth user
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
        avatarUrl: null,
        accountType: 'PERSONAL',
        kycTier: 1,
        status: 'ACTIVE',
        emailVerified: true,
      },
      accessToken: 'tok',
      refreshToken: 'ref',
      isAuthenticated: true,
      isHydrating: false,
    });
    // Reset chat store
    useChatStore.setState({
      messageHistory: {},
      messagesCursor: {},
      hasMoreMessages: {},
      rooms: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── render-1: renders messages from store ─────────────────────────────────

  it('(render-1) renders message content when store is pre-populated', async () => {
    const msg = makeMessage({ id: 'msg-001', content: '你好世界' });
    // Pre-populate store so the component skips the initial fetch
    useChatStore.setState({
      messageHistory: { [ROOM_ID]: [msg] },
      messagesCursor: { [ROOM_ID]: '' },
      hasMoreMessages: { [ROOM_ID]: false },
    });

    mockGetMessages.mockResolvedValue([msg]);

    const { default: MessageList } = await import('./MessageList');
    await act(async () => {
      render(<MessageList roomId={ROOM_ID} />);
    });

    // Message content should appear in the rendered output (via MessageGroup stub)
    expect(screen.getByText('你好世界')).toBeInTheDocument();
  });

  // ── render-2: shows loading state ─────────────────────────────────────────

  it('(render-2) shows loading indicator before messages load', async () => {
    // getMessages never resolves during this test
    mockGetMessages.mockReturnValue(new Promise(() => {}));

    const { default: MessageList } = await import('./MessageList');
    render(<MessageList roomId={ROOM_ID} />);

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  // ── render-3: load-more banner appears after store hasMoreMessages=true ───

  it('(render-3) shows load-more banner when hasMoreMessages is set after successful load', async () => {
    const msg = makeMessage({ id: 'msg-001', content: '訊息一', created_at: 1700000000 });

    // Load succeeds so component reaches 'loaded' status.
    mockGetMessages.mockResolvedValueOnce([msg]);

    const { default: MessageList } = await import('./MessageList');
    await act(async () => {
      render(<MessageList roomId={ROOM_ID} />);
    });

    // After successful load, set hasMore=true in the store to make the banner appear.
    await act(async () => {
      useChatStore.setState({
        hasMoreMessages: { [ROOM_ID]: true },
      });
    });

    // The "往上滾動載入更多" banner should now appear since hasMoreMessages=true.
    expect(screen.getByText('往上滾動載入更多')).toBeInTheDocument();
  });

  // ── error-1: initial load failure shows error state with retry ────────────

  it('(error-1) shows error state and retry button on initial load failure', async () => {
    mockGetMessages.mockRejectedValue(new Error('API error'));

    const { default: MessageList } = await import('./MessageList');
    await act(async () => {
      render(<MessageList roomId={ROOM_ID} />);
    });

    expect(screen.getByText(/服務暫時無法使用/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
  });
});
