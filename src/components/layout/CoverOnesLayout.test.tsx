/**
 * CoverOnesLayout — rooms-loading regression test
 *
 * Verifies that the layout loads rooms on mount so ChatRoomPage
 * never sees an empty chatStore.rooms[]. Regression: fix/chat-load-rooms-on-mount
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

/* ── mocks (hoisted) ────────────────────────────────────────────────────────── */

vi.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: vi.fn(),
  },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('./AppShell', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./CoverOnesSidebar', () => ({ default: () => <nav aria-label="sidebar" /> }));
vi.mock('./CoverOnesTopbar', () => ({ default: () => <header /> }));
vi.mock('./CoverOnesMobileBottomNav', () => ({ default: () => <nav aria-label="bottom-nav" /> }));
vi.mock('./MobileDrawer', () => ({ default: () => null }));
vi.mock('./MobileFABProvider', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../chat/ChatPopup', () => ({ default: () => null }));
vi.mock('../auth/UnverifiedBanner', () => ({ UnverifiedBanner: () => null }));

/* jsdom does not implement window.matchMedia — stub it before the component runs */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/* Import after mocks are hoisted */
import CoverOnesLayout from './CoverOnesLayout';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import type { Room } from '../../types';

/* ── helpers ────────────────────────────────────────────────────────────────── */

const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Test Room',
    type: 'direct',
    owner_id: 'user-42',
    members: [{ user_id: 'user-42', role: 'admin' }],
    created_at: 1700000000,
  },
];

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

/* ── useAuthStore selector helper ───────────────────────────────────────────── */

type AuthSelector<T> = (state: { user: { id: string } | null }) => T;

/** Simulate useAuthStore with a real selector call so `(s) => s.user?.id ?? ''` is exercised. */
function mockAuthUser(id: string) {
  vi.mocked(useAuthStore).mockImplementation(<T,>(selector: AuthSelector<T>) =>
    selector({ user: { id } }) as T
  );
}

function mockAuthNoUser() {
  vi.mocked(useAuthStore).mockImplementation(<T,>(selector: AuthSelector<T>) =>
    selector({ user: null }) as T
  );
}

describe('CoverOnesLayout — rooms loading', () => {
  beforeEach(() => {
    useChatStore.setState({ rooms: [], roomsLoaded: false });
    vi.clearAllMocks();
    // Default: no user
    mockAuthNoUser();
  });

  it('calls chatApi.getRooms on mount when userId is available and populates chatStore', async () => {
    // Arrange: authenticated user — selector `(s) => s.user?.id ?? ''` must return 'user-42'
    mockAuthUser('user-42');
    vi.mocked(chatApi.getRooms).mockResolvedValue({
      success: true,
      data: MOCK_ROOMS,
    });

    const Wrapper = createWrapper();
    render(<CoverOnesLayout />, { wrapper: Wrapper });

    // Assert: getRooms called with correct args
    await waitFor(() => {
      expect(chatApi.getRooms).toHaveBeenCalledWith('user-42', 50, '');
    });

    // Assert: store populated
    await waitFor(() => {
      expect(useChatStore.getState().rooms).toHaveLength(1);
      expect(useChatStore.getState().rooms[0].id).toBe('room-1');
      expect(useChatStore.getState().roomsLoaded).toBe(true);
    });
  });

  it('does NOT call chatApi.getRooms when userId is empty (unauthenticated guard)', () => {
    // mockAuthNoUser already set in beforeEach — selector returns '' (user is null)
    const Wrapper = createWrapper();
    render(<CoverOnesLayout />, { wrapper: Wrapper });

    // Synchronous: no API call should be made because userId === ''
    expect(chatApi.getRooms).not.toHaveBeenCalled();
  });

  it('sets roomsLoaded=true even when getRooms throws (error resilience)', async () => {
    mockAuthUser('user-42');
    vi.mocked(chatApi.getRooms).mockRejectedValue(new Error('network error'));

    const Wrapper = createWrapper();
    render(<CoverOnesLayout />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(useChatStore.getState().roomsLoaded).toBe(true);
    });
    // rooms remains empty on error — ChatRoomPage must handle this
    expect(useChatStore.getState().rooms).toHaveLength(0);
  });

  it('selector (s)=>s.user?.id??empty is invoked — null user yields empty string', () => {
    // Verifies the selector path: null user must produce '' (not throw)
    mockAuthNoUser();
    const Wrapper = createWrapper();
    // Should render without throwing; getRooms must NOT be called
    expect(() => render(<CoverOnesLayout />, { wrapper: Wrapper })).not.toThrow();
    expect(chatApi.getRooms).not.toHaveBeenCalled();
  });
});
