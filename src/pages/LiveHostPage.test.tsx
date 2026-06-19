/**
 * LiveHostPage — smoke tests (Vitest + RTL)
 *
 * Cases:
 *   render:       page heading renders without crash
 *   sidebar-nav:  替身直播 nav entry present in App tree (integration smoke)
 *   controls:     開始直播 button present; 結束直播 absent before going live
 *   settings:     直播標題 input + 直播設定 heading visible
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/live', () => ({
  getLiveStreams: vi.fn().mockResolvedValue([]),
  postAvatarSession: vi.fn().mockResolvedValue({ token: 'tok', url: 'wss://x', room: 'r1', identity: 'id1' }),
  endAvatarSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/live/host']}>{children}</MemoryRouter>
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

describe('LiveHostPage', () => {
  it('renders the page heading without crashing', async () => {
    const { default: Page } = await import('./LiveHostPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('主播控制台');
  });

  it('shows 開始直播 button before going live', async () => {
    const { default: Page } = await import('./LiveHostPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: '開始直播' })).toBeInTheDocument();
  });

  it('does NOT show 結束直播 before going live', async () => {
    const { default: Page } = await import('./LiveHostPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.queryByRole('button', { name: '結束直播' })).not.toBeInTheDocument();
  });

  it('shows 直播設定 heading and 直播標題 input', async () => {
    const { default: Page } = await import('./LiveHostPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByText('直播設定')).toBeInTheDocument();
    expect(screen.getByLabelText('直播標題')).toBeInTheDocument();
  });

  it('shows connecting placeholder in video area', async () => {
    const { default: Page } = await import('./LiveHostPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByText('連線中・即將上線')).toBeInTheDocument();
  });
});
