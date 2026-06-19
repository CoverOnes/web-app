/**
 * useSSE tests
 *
 * Coverage:
 *   sse-1: NO EventSource is opened when accessToken === null
 *   sse-2: EventSource IS opened once a non-empty token is present
 *   sse-3: EventSource is closed on unmount (cleanup)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';

// ─── Mock EventSource ─────────────────────────────────────────────────────────

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  readyState = 0;
  private listeners: Record<string, Array<(e: MessageEvent) => void>> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, handler: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  removeEventListener(type: string, handler: (e: MessageEvent) => void) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(h => h !== handler);
  }

  dispatchEvent(type: string, data: unknown) {
    (this.listeners[type] ?? []).forEach(h => h({ data: JSON.stringify(data) } as MessageEvent));
  }

  close = vi.fn();

  static reset() {
    MockEventSource.instances = [];
  }
}

// Patch global EventSource
const OriginalEventSource = globalThis.EventSource;

beforeEach(() => {
  MockEventSource.reset();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).EventSource = MockEventSource;
});

afterEach(() => {
  globalThis.EventSource = OriginalEventSource;
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSSE', () => {
  const ROOM_ID = 'room-abc';
  const USER_ID = 'user-abc';

  // ── sse-1: no connection when accessToken is null ─────────────────────────

  it('(sse-1) does NOT open EventSource when accessToken is null', async () => {
    // Ensure store has no token
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrating: false,
    });

    const { useSSE } = await import('./useSSE');
    const { result } = renderHook(() =>
      useSSE({ roomId: ROOM_ID, userId: USER_ID })
    );

    // No EventSource should be created
    expect(MockEventSource.instances).toHaveLength(0);
    expect(result.current.isConnected).toBe(false);
  });

  // ── sse-2: opens EventSource once a token is available ────────────────────

  it('(sse-2) opens EventSource once accessToken is present', async () => {
    // Start with no token
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrating: false,
    });

    const { useSSE } = await import('./useSSE');
    const { rerender } = renderHook(() =>
      useSSE({ roomId: ROOM_ID, userId: USER_ID })
    );

    // Still no EventSource
    expect(MockEventSource.instances).toHaveLength(0);

    // Now inject a token
    await act(async () => {
      useAuthStore.setState({ accessToken: 'tok-123' });
    });
    rerender();

    // EventSource should now be created
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });
    expect(MockEventSource.instances[0].url).toContain('access_token=tok-123');
  });

  // ── sse-3: EventSource closed on unmount ──────────────────────────────────

  it('(sse-3) closes EventSource on unmount', async () => {
    useAuthStore.setState({
      accessToken: 'tok-xyz',
      refreshToken: 'ref',
      user: { id: USER_ID, email: 'a@b.com', displayName: 'A', avatarUrl: null, accountType: 'PERSONAL', kycTier: 1, status: 'ACTIVE', emailVerified: true },
      isAuthenticated: true,
      isHydrating: false,
    });

    const { useSSE } = await import('./useSSE');
    const { unmount } = renderHook(() =>
      useSSE({ roomId: ROOM_ID, userId: USER_ID })
    );

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const instance = MockEventSource.instances[0];
    unmount();

    expect(instance.close).toHaveBeenCalled();
  });
});
