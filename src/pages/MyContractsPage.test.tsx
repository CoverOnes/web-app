/**
 * MyContractsPage — empty/loading/data state tests.
 *
 * Tests:
 *   render: loading skeleton, empty state, error state, contract list render
 *   interaction: filter tab changes query status, search narrows rows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useContracts } from '../lib/query';
import type { Contract } from '../lib/api/coverones';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../lib/query', () => ({
  useContracts: vi.fn(),
}));

const mockUseContracts = vi.mocked(useContracts);

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'c1',
    listingId: 'l1',
    clientUserId: 'client-1',
    freelancerUserId: 'freelancer-1',
    title: '測試合約標題',
    terms: 'Terms',
    amount: '100000',
    currency: 'TWD',
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    contentHash: 'abc123',
    ...overrides,
  };
}

// Minimal query result shape for useContracts
function makeQueryResult(overrides: object = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('MyContractsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'tok',
      refreshToken: 'ref',
      user: {
        id: 'client-1',
        email: 'client@example.com',
        displayName: 'Client User',
        avatarUrl: null,
        accountType: 'PERSONAL',
        kycTier: 2,
        status: 'ACTIVE',
        emailVerified: true,
      },
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  // ── render: loading ──────────────────────────────────────────────────────────

  it('(render-1) shows loading skeletons while data is loading', async () => {
    mockUseContracts.mockReturnValue(makeQueryResult({ isLoading: true }));
    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Skeletons are aria-hidden — check they exist via their class
    const skeletons = document.querySelectorAll('[aria-hidden="true"].rounded-xl');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── render: error ────────────────────────────────────────────────────────────

  it('(render-2) shows error empty state on fetch failure', async () => {
    mockUseContracts.mockReturnValue(makeQueryResult({ isError: true }));
    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    expect(screen.getByText('載入失敗')).toBeInTheDocument();
  });

  // ── render: empty ────────────────────────────────────────────────────────────

  it('(render-3) shows empty state when contracts array is empty', async () => {
    mockUseContracts.mockReturnValue(makeQueryResult({ data: [] }));
    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    expect(screen.getByText('目前沒有合約')).toBeInTheDocument();
  });

  // ── render: data ─────────────────────────────────────────────────────────────

  it('(render-4) renders contract title and amount from API data', async () => {
    const contract = makeContract({ title: '企業導購系統合約', amount: '1840000', currency: 'TWD' });
    mockUseContracts.mockReturnValue(makeQueryResult({ data: [contract] }));
    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    expect(screen.getByText('企業導購系統合約')).toBeInTheDocument();
    expect(screen.getByText(/1,840,000/)).toBeInTheDocument();
  });

  // ── render: stat cards reflect real data ─────────────────────────────────────

  it('(render-5) stat cards show counts derived from real API contracts', async () => {
    const contracts = [
      makeContract({ id: 'c1', status: 'ACTIVE' }),
      makeContract({ id: 'c2', status: 'ACTIVE' }),
      makeContract({ id: 'c3', status: 'PENDING_SIGNATURE' }),
    ];
    mockUseContracts.mockReturnValue(makeQueryResult({ data: contracts }));
    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Active count = 2
    const statCells = screen.getAllByText('2');
    expect(statCells.length).toBeGreaterThan(0);
  });

  // ── interaction: filter tabs ─────────────────────────────────────────────────

  it('(interaction-1) clicking filter tab calls useContracts with correct status', async () => {
    const user = userEvent.setup();
    const contracts = [makeContract({ status: 'PENDING_SIGNATURE' })];
    // First call: ALL, second call: PENDING_SIGNATURE
    mockUseContracts
      .mockReturnValueOnce(makeQueryResult({ data: contracts }))
      .mockReturnValue(makeQueryResult({ data: contracts }));

    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Click the "待簽署" filter tab
    const pendingTab = screen.getByRole('tab', { name: /待簽署/ });
    await user.click(pendingTab);

    // After clicking, useContracts should have been called with PENDING_SIGNATURE
    expect(mockUseContracts).toHaveBeenCalledWith('PENDING_SIGNATURE');
  });

  // ── interaction: search ──────────────────────────────────────────────────────

  it('(interaction-2) search input filters contracts by title client-side', async () => {
    const user = userEvent.setup();
    const contracts = [
      makeContract({ id: 'c1', title: '企業導購系統合約' }),
      makeContract({ id: 'c2', title: '設計服務合約' }),
    ];
    mockUseContracts.mockReturnValue(makeQueryResult({ data: contracts }));

    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    const searchBox = screen.getByRole('searchbox', { name: '搜尋合約' });
    await user.type(searchBox, '設計');

    expect(screen.getByText('設計服務合約')).toBeInTheDocument();
    expect(screen.queryByText('企業導購系統合約')).not.toBeInTheDocument();
  });

  // ── interaction: empty search result ────────────────────────────────────────

  it('(interaction-3) shows "找不到符合的合約" when search has no matches', async () => {
    const user = userEvent.setup();
    const contracts = [makeContract({ title: '企業導購系統合約' })];
    mockUseContracts.mockReturnValue(makeQueryResult({ data: contracts }));

    const { default: Page } = await import('./MyContractsPage');
    render(<Page />, { wrapper: makeWrapper() });

    const searchBox = screen.getByRole('searchbox', { name: '搜尋合約' });
    await user.type(searchBox, 'NOMATCH_XYZ');

    expect(screen.getByText('找不到符合的合約')).toBeInTheDocument();
  });

  // ── render: right-rail empty-states ──────────────────────────────────────────

  it('(render-6) right-rail sections show empty-state text (no API for cashflow/templates)', async () => {
    mockUseContracts.mockReturnValue(makeQueryResult({ data: [] }));
    const { default: Page } = await import('./MyContractsPage');
    const { container } = render(<Page />, { wrapper: makeWrapper() });

    // "尚無收款資料" appears for cashflow card
    const cashflowTexts = within(container).getAllByText(/尚無收款資料/);
    expect(cashflowTexts.length).toBeGreaterThan(0);

    // "尚無資料" appears for templates
    const noDataTexts = within(container).getAllByText(/尚無資料/);
    expect(noDataTexts.length).toBeGreaterThan(0);
  });

  // ── render: stats-under-filter regression ────────────────────────────────────
  // When a filter tab is active, the stat cards must reflect the UNFILTERED total,
  // not the filtered count. This verifies that useContracts(undefined) drives stats
  // while the filtered query drives the table.

  it('(render-7) stat cards show ALL-based totals even when a filter tab is active', async () => {
    const allContracts = [
      makeContract({ id: 'c1', status: 'ACTIVE' }),
      makeContract({ id: 'c2', status: 'ACTIVE' }),
      makeContract({ id: 'c3', status: 'PENDING_SIGNATURE' }),
    ];
    const filteredContracts = [makeContract({ id: 'c3', status: 'PENDING_SIGNATURE' })];

    // useContracts is called twice: once with undefined (for stats) and once with
    // the active filter. We differentiate via the argument.
    mockUseContracts.mockImplementation((status) => {
      if (status === undefined) {
        return makeQueryResult({ data: allContracts });
      }
      return makeQueryResult({ data: filteredContracts });
    });

    const { default: Page } = await import('./MyContractsPage');
    const user = userEvent.setup();
    render(<Page />, { wrapper: makeWrapper() });

    // Click the "待簽署" tab to activate a filter
    const pendingTab = screen.getByRole('tab', { name: /待簽署/ });
    await user.click(pendingTab);

    // The stat card for "進行中合約" should show 2 (from ALL contracts, ACTIVE count)
    // not 0 (which would be the PENDING_SIGNATURE filtered count).
    // Active count = 2 from allContracts
    const activeCountCells = screen.getAllByText('2');
    expect(activeCountCells.length).toBeGreaterThan(0);

    // Total count should be 3 (all contracts), not 1 (filtered)
    expect(screen.getByText(/共 3 份合約/)).toBeInTheDocument();
  });
});
