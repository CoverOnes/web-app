/**
 * useToast — lightweight module-level toast state.
 *
 * No React context needed: module-level arrays + subscriber pattern.
 * Consumers call useToast() to get reactive access to the toast list.
 * Non-React code (or hooks without re-render needs) can call addToast / removeToast directly.
 */
import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  body: string;
  type: 'info';
}

// ─── Module-level singleton ───────────────────────────────────────────────────

let _toasts: Toast[] = [];
const _listeners = new Set<() => void>();

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

export function addToast(t: Omit<Toast, 'id'>): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // Max 3 stacked: remove oldest when 4th arrives
  const base = _toasts.length >= 3 ? _toasts.slice(1) : _toasts;
  _toasts = [...base, { ...t, id }];
  _notify();
  setTimeout(() => removeToast(id), 5000);
}

export function removeToast(id: string): void {
  _toasts = _toasts.filter((t) => t.id !== id);
  _notify();
}

// ─── React hook ──────────────────────────────────────────────────────────────

export interface ToastAPI {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export function useToast(): ToastAPI {
  const [toasts, setToasts] = useState<Toast[]>(_toasts);

  useEffect(() => {
    // Sync latest state on mount (in case toasts were added before mount)
    setToasts([..._toasts]);
    const sync = () => setToasts([..._toasts]);
    _listeners.add(sync);
    return () => {
      _listeners.delete(sync);
    };
  }, []);

  return { toasts, addToast, removeToast };
}
