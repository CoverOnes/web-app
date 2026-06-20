/**
 * ToastContainer tests.
 *
 * Cases:
 *   render: renders nothing when no toasts, renders toast items when toasts exist
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ToastContainer } from './ToastContainer';
import { addToast, __resetToasts } from './useToast';

describe('ToastContainer', () => {
  beforeEach(() => {
    __resetToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('(render-1) renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    // No aria-live region rendered when toast list is empty
    expect(container.firstChild).toBeNull();
  });

  it('(render-2) renders toast items when toasts are present', () => {
    render(<ToastContainer />);

    act(() => {
      addToast({ title: '你有新通知', body: '2 則未讀', type: 'info' });
    });

    expect(screen.getByText('你有新通知')).toBeTruthy();
    expect(screen.getByText('2 則未讀')).toBeTruthy();
  });

  it('(render-3) renders close button for each toast', () => {
    render(<ToastContainer />);

    act(() => {
      addToast({ title: 'Toast A', body: 'body A', type: 'info' });
      addToast({ title: 'Toast B', body: 'body B', type: 'info' });
    });

    const closeButtons = screen.getAllByRole('button', { name: '關閉通知' });
    expect(closeButtons).toHaveLength(2);
  });
});
