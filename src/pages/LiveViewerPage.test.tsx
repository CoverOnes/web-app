/**
 * LiveViewerPage — smoke tests (Vitest + RTL)
 *
 * Cases:
 *   render:       page renders without crash; back-button present
 *   placeholder:  connecting overlay text visible
 *   chat:         empty chat state text visible
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/live', () => ({
  getLiveStreams: vi.fn().mockResolvedValue([]),
  postAvatarSession: vi.fn(),
  endAvatarSession: vi.fn(),
}));

function makeWrapper(roomId = 'room-abc') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/live/${roomId}`]}>
        <Routes>
          <Route path="/live/:roomId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: {
      id: 'u1',
      email: 'test@example.com',
      displayName: 'Test',
      avatarUrl: null,
      accountType: 'PERSONAL',
      kycTier: 1,
      status: 'ACTIVE',
      emailVerified: true,
    },
    isAuthenticated: true,
    isHydrating: false,
  });
});

describe('LiveViewerPage', () => {
  it('renders without crashing and shows back button', async () => {
    const { default: Page } = await import('./LiveViewerPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /返回直播台列表/ })).toBeInTheDocument();
  });

  it('shows the connecting overlay placeholder', async () => {
    const { default: Page } = await import('./LiveViewerPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByText('連線中・即將上線')).toBeInTheDocument();
  });

  it('shows empty chat state text', async () => {
    const { default: Page } = await import('./LiveViewerPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByText('目前還沒有人說話')).toBeInTheDocument();
  });
});
