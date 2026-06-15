/**
 * Home.tsx — basic render test
 *
 * The IS_DEMO_HOME flag and PLACEHOLDER_PROJECTS fixtures have been removed.
 * Home now shows real listings from useListings({ status: 'OPEN' }) or an EmptyState.
 *
 * These tests verify:
 *   1. Page renders without crashing when useListings returns empty
 *   2. Page renders listing cards when listings are returned
 *   3. No hardcoded brand names appear in rendered output
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useListings } from '../lib/query';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../lib/query', () => ({
  useListings: vi.fn(),
}));

const mockUseListings = vi.mocked(useListings);

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

describe('Home — real data or EmptyState', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test User',
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

  it('renders without crashing when listings are empty', async () => {
    mockUseListings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    const { default: Home } = await import('./Home');
    render(<Home />, { wrapper: makeWrapper() });

    // EmptyState is shown
    expect(screen.getByText('目前沒有開放案件')).toBeInTheDocument();
  });

  it('renders listing cards from real API data', async () => {
    mockUseListings.mockReturnValue({
      data: [
        {
          id: 'lst-1',
          title: '後端開發外包案',
          description: '需有 Go 開發經驗',
          status: 'OPEN',
          ownerUserId: 'owner-1',
          currency: 'TWD',
          budgetMin: 500000,
          budgetMax: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    const { default: Home } = await import('./Home');
    render(<Home />, { wrapper: makeWrapper() });

    expect(screen.getByText('後端開發外包案')).toBeInTheDocument();
  });

  it('does NOT render any hardcoded fake brand names', async () => {
    mockUseListings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    const { default: Home } = await import('./Home');
    const { container } = render(<Home />, { wrapper: makeWrapper() });

    const html = container.innerHTML;
    expect(html).not.toContain('台積電子');
    expect(html).not.toContain('誠品文創');
    expect(html).not.toContain('沛星互動');
  });
});
