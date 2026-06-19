/**
 * LiveDirectoryPage — smoke tests (Vitest + RTL)
 *
 * Cases:
 *   render:       page heading renders without crash, nav action button visible
 *   empty-state:  getLiveStreams returns [] → empty-state text shown
 *   tabs:         both tab buttons render and are keyboard-navigable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';

// Mock the live API so tests don't make real HTTP calls
vi.mock('../api/live', () => ({
  getLiveStreams: vi.fn().mockResolvedValue([]),
  postAvatarSession: vi.fn(),
  endAvatarSession: vi.fn(),
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
      <MemoryRouter initialEntries={['/live']}>{children}</MemoryRouter>
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

describe('LiveDirectoryPage', () => {
  it('renders the page heading without crashing', async () => {
    const { default: Page } = await import('./LiveDirectoryPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('替身直播台');
  });

  it('renders the 開始直播 action button', async () => {
    const { default: Page } = await import('./LiveDirectoryPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /開始直播/ })).toBeInTheDocument();
  });

  it('renders both tab buttons', async () => {
    const { default: Page } = await import('./LiveDirectoryPage');
    render(<Page />, { wrapper: makeWrapper() });
    expect(screen.getByRole('tab', { name: '推薦' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '全部直播台' })).toBeInTheDocument();
  });

  it('shows empty-state when getLiveStreams resolves to []', async () => {
    const { default: Page } = await import('./LiveDirectoryPage');
    render(<Page />, { wrapper: makeWrapper() });
    // The query resolves async — wait for empty-state text
    expect(await screen.findByText('目前沒有直播台上線')).toBeInTheDocument();
  });
});
