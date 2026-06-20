/**
 * useToast tests.
 *
 * Cases:
 *   render:      addToast adds to list, removeToast removes from list
 *   interaction: auto-dismiss after 5 s timeout, max-3 stacking (4th drops oldest)
 *
 * Module-level singleton isolation is handled by __resetToasts in
 * src/test/setup.ts afterEach, plus an explicit beforeEach here for safety.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { addToast, removeToast, useToast, __resetToasts } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    __resetToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── render ──────────────────────────────────────────────────────────────────

  it('(render-1) addToast adds a toast that appears in the hook', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      addToast({ title: 'Hello', body: 'World', type: 'info' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Hello');
    expect(result.current.toasts[0].body).toBe('World');
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].id).toMatch(/^toast-/);
  });

  it('(render-2) removeToast removes the correct toast by id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      addToast({ title: 'Keep', body: 'keep', type: 'info' });
      addToast({ title: 'Remove', body: 'remove', type: 'info' });
    });

    expect(result.current.toasts).toHaveLength(2);
    const idToRemove = result.current.toasts[1].id;

    act(() => {
      removeToast(idToRemove);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Keep');
  });

  // ─── interaction ─────────────────────────────────────────────────────────────

  it('(interaction-1) auto-dismiss: toast is removed after 5000 ms', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      addToast({ title: 'Auto', body: 'auto', type: 'info' });
    });
    expect(result.current.toasts).toHaveLength(1);

    // Still present before 5 s
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(result.current.toasts).toHaveLength(1);

    // Removed at 5 s
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('(interaction-2) max-3 stacking: adding a 4th toast drops the oldest', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      addToast({ title: 'One', body: '1', type: 'info' });
      addToast({ title: 'Two', body: '2', type: 'info' });
      addToast({ title: 'Three', body: '3', type: 'info' });
    });
    expect(result.current.toasts).toHaveLength(3);
    const firstId = result.current.toasts[0].id;

    act(() => {
      addToast({ title: 'Four', body: '4', type: 'info' });
    });

    expect(result.current.toasts).toHaveLength(3);
    // The oldest toast (index 0 before adding Four) should be gone
    expect(result.current.toasts.find((t) => t.id === firstId)).toBeUndefined();
    // The newest should be present
    expect(result.current.toasts[2].title).toBe('Four');
  });
});
