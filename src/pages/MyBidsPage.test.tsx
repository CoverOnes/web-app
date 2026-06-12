/**
 * MyBidsPage tests
 *
 * Coverage:
 *   1. stepsForBid — correct step labels & states for all 4 statuses + unknown-status fallback
 *   2. focusBid selection priority: selectedBidId match → first PENDING → bids[0]
 *   3. winRate null guard: totalCount===0 → null → renders "—"
 *   4. Withdraw button only visible for PENDING cards
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { stepsForBid } from './MyBidsPage.utils';
import MyBidsPage from './MyBidsPage';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useMyBids, useWithdrawBid } from '../lib/query';
import type { Bid } from '../lib/api/coverones';

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('../lib/query', () => ({
  useMyBids: vi.fn(),
  useWithdrawBid: vi.fn(),
}));

const mockUseMyBids    = vi.mocked(useMyBids);
const mockUseWithdrawBid = vi.mocked(useWithdrawBid);

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockUser: AuthUser = {
  id: 'u1',
  email: 'bidder@example.com',
  displayName: 'Bidder',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 1,
  status: 'ACTIVE',
  emailVerified: true,
};

function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid-0001-0000-0000-000000000000',
    listingId: 'lst-0001-0000-0000-000000000000',
    bidderUserId: 'usr-0001',
    amount: '100000',
    currency: 'TWD',
    message: '投標留言',
    status: 'PENDING',
    ...overrides,
  };
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<MyBidsPage />, { wrapper: makeWrapper() });
}

// ─── stepsForBid unit tests ────────────────────────────────────────────────

describe('stepsForBid', () => {
  it('PENDING: 4th step is "now", 5th is "todo"', () => {
    const steps = stepsForBid(makeBid({ status: 'PENDING' }));
    expect(steps).toHaveLength(5);
    expect(steps[3].state).toBe('now');
    expect(steps[3].label).toBe('買方評估');
    expect(steps[4].state).toBe('todo');
    expect(steps[4].label).toBe('合約簽訂');
  });

  it('ACCEPTED: all 5 steps are "done"', () => {
    const steps = stepsForBid(makeBid({ status: 'ACCEPTED' }));
    expect(steps).toHaveLength(5);
    steps.forEach((s) => expect(s.state).toBe('done'));
    expect(steps[4].label).toBe('合約簽訂');
  });

  it('REJECTED: all 5 steps are "done", last label is "結果公告"', () => {
    const steps = stepsForBid(makeBid({ status: 'REJECTED' }));
    expect(steps).toHaveLength(5);
    steps.forEach((s) => expect(s.state).toBe('done'));
    expect(steps[4].label).toBe('結果公告');
  });

  it('WITHDRAWN: 4th step label is "撤回", 5th is "todo"', () => {
    const steps = stepsForBid(makeBid({ status: 'WITHDRAWN' }));
    expect(steps).toHaveLength(5);
    expect(steps[3].label).toBe('撤回');
    expect(steps[3].state).toBe('done');
    expect(steps[4].state).toBe('todo');
  });

  it('unknown status falls back to PENDING steps', () => {
    // Cast to force an unsupported status value (simulates a future API addition).
    const steps = stepsForBid(makeBid({ status: 'UNKNOWN' as Bid['status'] }));
    expect(steps).toHaveLength(5);
    expect(steps[3].state).toBe('now'); // PENDING's 4th step
  });
});

// ─── Page render tests ────────────────────────────────────────────────────

describe('MyBidsPage — winRate null guard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: mockUser,
      isAuthenticated: true,
      isHydrating: false,
    });
    mockUseWithdrawBid.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useWithdrawBid>);
  });

  it('renders "—" for 整體得標率 when there are no bids (totalCount===0)', async () => {
    mockUseMyBids.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      isPending: false,
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useMyBids>);

    renderPage();

    // winRate is null when totalCount===0 — the StatCard should display "—"
    expect(screen.getByText('整體得標率')).toBeInTheDocument();
    // The StatCard for 整體得標率 displays its value below the label
    const statCards = screen.getAllByText('—');
    expect(statCards.length).toBeGreaterThanOrEqual(1);
  });
});

describe('MyBidsPage — focusBid selection priority', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: mockUser,
      isAuthenticated: true,
      isHydrating: false,
    });
    mockUseWithdrawBid.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useWithdrawBid>);
  });

  it('defaults focus to the first PENDING bid when no card is clicked', () => {
    const bids: Bid[] = [
      makeBid({ id: 'bid-accepted', listingId: 'lst-accepted-00', status: 'ACCEPTED' }),
      makeBid({ id: 'bid-pending',  listingId: 'lst-pending-00',  status: 'PENDING'  }),
    ];
    mockUseMyBids.mockReturnValue({
      data: bids,
      isLoading: false,
      isError: false,
      isPending: false,
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useMyBids>);

    renderPage();

    // The focus panel h2 heading includes the focused bid's listingId slice (0,8).
    // "lst-pending-00".slice(0,8) === "lst-pend"
    const heading = screen.getByRole('heading', { name: /當前焦點案件/ });
    expect(heading.textContent).toMatch(/lst-pend/);
  });

  it('falls back to bids[0] when there are no PENDING bids', () => {
    const bids: Bid[] = [
      makeBid({ id: 'bid-accepted', listingId: 'lst-first-00', status: 'ACCEPTED' }),
      makeBid({ id: 'bid-rejected', listingId: 'lst-second-0', status: 'REJECTED' }),
    ];
    mockUseMyBids.mockReturnValue({
      data: bids,
      isLoading: false,
      isError: false,
      isPending: false,
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useMyBids>);

    renderPage();

    // "lst-first-00".slice(0,8) === "lst-firs"
    const heading = screen.getByRole('heading', { name: /當前焦點案件/ });
    expect(heading.textContent).toMatch(/lst-firs/);
  });

  it('updates focus to the clicked card bid', async () => {
    const user = userEvent.setup();
    const bids: Bid[] = [
      makeBid({ id: 'bid-p1', listingId: 'lst-alpha-00', status: 'PENDING' }),
      makeBid({ id: 'bid-p2', listingId: 'lst-beta-000', status: 'PENDING' }),
    ];
    mockUseMyBids.mockReturnValue({
      data: bids,
      isLoading: false,
      isError: false,
      isPending: false,
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useMyBids>);

    renderPage();

    // Cards aria-label: "投標 lst-alph — 評估中" and "投標 lst-beta — 評估中"
    // "lst-alpha-00".slice(0,8) === "lst-alph"; "lst-beta-000".slice(0,8) === "lst-beta"
    const secondCard = screen.getByRole('button', { name: /投標 lst-beta — 評估中/ });
    await user.click(secondCard);

    // Focus panel heading should now reference the second bid
    const heading = screen.getByRole('heading', { name: /當前焦點案件/ });
    expect(heading.textContent).toMatch(/lst-beta/);
  });
});

describe('MyBidsPage — withdraw button visibility', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: mockUser,
      isAuthenticated: true,
      isHydrating: false,
    });
    mockUseWithdrawBid.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useWithdrawBid>);
  });

  it('shows withdraw button only for PENDING bids', async () => {
    const bids: Bid[] = [
      makeBid({ id: 'bid-p', status: 'PENDING'   }),
      makeBid({ id: 'bid-a', status: 'ACCEPTED'  }),
      makeBid({ id: 'bid-r', status: 'REJECTED'  }),
      makeBid({ id: 'bid-w', status: 'WITHDRAWN' }),
    ];
    mockUseMyBids.mockReturnValue({
      data: bids,
      isLoading: false,
      isError: false,
      isPending: false,
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useMyBids>);

    renderPage();

    // The kanban "撤回" button is aria-labeled with the bid short-ID.
    // Only PENDING bids get a WithdrawButton overlay on the kanban card.
    const withdrawBtns = screen.getAllByRole('button', { name: /撤回投標 bid-p/ });
    expect(withdrawBtns.length).toBeGreaterThanOrEqual(1);

    // ACCEPTED/REJECTED/WITHDRAWN cards must NOT have a withdraw button.
    expect(screen.queryByRole('button', { name: /撤回投標 bid-a/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /撤回投標 bid-r/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /撤回投標 bid-w/ })).not.toBeInTheDocument();
  });
});
