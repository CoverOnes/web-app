/**
 * NetworkPage tests (Vitest + RTL).
 *
 * Cases:
 *   render:      page heading + breadcrumb + accepted connections list
 *   empty-state: both lists empty → "尚無已連結的人脈" + graph "尚無連結"
 *   interaction: open invite form, type userId, submit → useSendInvite fires
 *   interaction: switch to 受邀請 tab → accept button fires useAcceptInvite
 *   error:       send-invite CONNECTION_EXISTS → "已是好友或邀請已存在" inline
 *   no-fake-data: deferred design strings/numbers are NOT rendered
 *
 * The connection hooks are mocked (mirrors MyBidsPage.test.tsx).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import NetworkPage from './NetworkPage';
import { useAuthStore, type AuthUser } from '../store/authStore';
import {
  useConnections,
  usePendingInvites,
  useSendInvite,
  useAcceptInvite,
  useDeclineInvite,
} from '../lib/query';
import type { Connection, PendingInvite } from '../lib/api/coverones';

/* jsdom does not implement window.matchMedia — stub it before useIsMobile runs.
   matches:false → desktop (graph cap 12). */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../lib/query', () => ({
  useConnections: vi.fn(),
  usePendingInvites: vi.fn(),
  useSendInvite: vi.fn(),
  useAcceptInvite: vi.fn(),
  useDeclineInvite: vi.fn(),
}));

const mockUseConnections = vi.mocked(useConnections);
const mockUsePendingInvites = vi.mocked(usePendingInvites);
const mockUseSendInvite = vi.mocked(useSendInvite);
const mockUseAcceptInvite = vi.mocked(useAcceptInvite);
const mockUseDeclineInvite = vi.mocked(useDeclineInvite);

// ─── Fixtures ──────────────────────────────────────────────────────────────────
const mockUser: AuthUser = {
  id: 'me-0001',
  email: 'me@example.com',
  displayName: 'Wayne',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 1,
  status: 'ACTIVE',
  emailVerified: true,
};

function makeConnection(over: Partial<Connection> = {}): Connection {
  return {
    id: 'conn-1',
    user: {
      userId: 'u-100',
      displayName: '台積電子',
      handle: 'tsmc',
      headline: '半導體製造',
      avatarUrl: null,
      accountType: 'COMPANY',
    },
    connectedAt: '2026-06-01T00:00:00Z',
    degree: 1,
    ...over,
  };
}

function makeInvite(over: Partial<PendingInvite> = {}): PendingInvite {
  return {
    id: 'inv-1',
    user: {
      userId: 'u-200',
      displayName: '中華電信',
      handle: 'cht',
      headline: '電信營運商',
      avatarUrl: null,
      accountType: 'COMPANY',
    },
    createdAt: '2026-06-10T00:00:00Z',
    ...over,
  };
}

// query-result stubs (only the fields the page reads).
function queryStub<T>(data: T | undefined, opts: Partial<{ isLoading: boolean; isError: boolean }> = {}) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as unknown as ReturnType<typeof useConnections>;
}

function mutationStub(over: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    ...over,
  } as unknown as ReturnType<typeof useSendInvite>;
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
  return render(<NetworkPage />, { wrapper: makeWrapper() });
}

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: mockUser,
    isAuthenticated: true,
    isHydrating: false,
  });
  // Default: no data — individual tests override.
  mockUseConnections.mockReturnValue(queryStub({ connections: [] }));
  mockUsePendingInvites.mockReturnValue(
    queryStub({ incoming: [], outgoing: [] }) as unknown as ReturnType<typeof usePendingInvites>,
  );
  mockUseSendInvite.mockReturnValue(mutationStub());
  mockUseAcceptInvite.mockReturnValue(mutationStub() as unknown as ReturnType<typeof useAcceptInvite>);
  mockUseDeclineInvite.mockReturnValue(mutationStub() as unknown as ReturnType<typeof useDeclineInvite>);
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('NetworkPage', () => {
  it('renders the page heading and breadcrumb', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('網路人脈');
    expect(screen.getByText('主選單 / 網路人脈')).toBeInTheDocument();
  });

  it('renders accepted connections with displayName, handle and account-type chip', () => {
    mockUseConnections.mockReturnValue(queryStub({ connections: [makeConnection()] }));
    renderPage();
    expect(screen.getByText('台積電子')).toBeInTheDocument();
    expect(screen.getByText('@tsmc')).toBeInTheDocument();
    expect(screen.getByText('半導體製造')).toBeInTheDocument();
    // accepted count (1) surfaces in the head subtitle "已連結 1 位夥伴".
    // The count sits in a nested <b>, so match on the containing <p>.
    expect(
      screen.getByText((_content, el) => el?.tagName === 'P' && el.textContent === '已連結 1 位夥伴'),
    ).toBeInTheDocument();
  });

  it('shows empty-state when both lists are empty', () => {
    renderPage();
    expect(
      screen.getByText(/尚無已連結的人脈/),
    ).toBeInTheDocument();
    // graph empty-state label (n=0)
    expect(screen.getByText('尚無連結')).toBeInTheDocument();
  });

  it('opens the invite form, accepts input, and fires useSendInvite on submit', async () => {
    const sendMutate = vi.fn();
    mockUseSendInvite.mockReturnValue(mutationStub({ mutate: sendMutate }));
    const user = userEvent.setup();
    renderPage();

    // open the form
    await user.click(screen.getByRole('button', { name: /邀請新連結/ }));
    const input = screen.getByLabelText('對方使用者 ID');
    await user.type(input, 'u-999');
    expect(input).toHaveValue('u-999');

    await user.click(screen.getByRole('button', { name: '送出邀請' }));
    expect(sendMutate).toHaveBeenCalledTimes(1);
    expect(sendMutate.mock.calls[0][0]).toBe('u-999');
  });

  it('surfaces CONNECTION_EXISTS inline as "已是好友或邀請已存在"', async () => {
    // mutate calls the per-call onError with a CONNECTION_EXISTS axios-like error.
    const sendMutate = vi.fn((_id: string, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.({ response: { data: { error: { code: 'CONNECTION_EXISTS' } } } });
    });
    mockUseSendInvite.mockReturnValue(mutationStub({ mutate: sendMutate }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /邀請新連結/ }));
    await user.type(screen.getByLabelText('對方使用者 ID'), 'u-dup');
    await user.click(screen.getByRole('button', { name: '送出邀請' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('已是好友或邀請已存在');
  });

  it('fires useAcceptInvite when accepting an incoming invite', async () => {
    const acceptMutate = vi.fn();
    mockUsePendingInvites.mockReturnValue(
      queryStub({ incoming: [makeInvite()], outgoing: [] }) as unknown as ReturnType<typeof usePendingInvites>,
    );
    mockUseAcceptInvite.mockReturnValue(
      mutationStub({ mutate: acceptMutate }) as unknown as ReturnType<typeof useAcceptInvite>,
    );
    const user = userEvent.setup();
    renderPage();

    // The right rail renders incoming invites with an 接受 button.
    const acceptBtn = screen.getByRole('button', { name: /接受 中華電信 的邀請/ });
    await user.click(acceptBtn);
    expect(acceptMutate).toHaveBeenCalledTimes(1);
    expect(acceptMutate.mock.calls[0][0]).toBe('inv-1');
  });

  it('does NOT render any deferred/fabricated company names or numbers', () => {
    // Render with one real connection; assert design-mock fake data is absent.
    mockUseConnections.mockReturnValue(queryStub({ connections: [makeConnection()] }));
    renderPage();
    // Fabricated company names from Network.html that have no backing API.
    for (const fake of ['沛星互動', '玉山銀行', '誠品文創', '鴻海精密', 'Google Cloud 台灣', 'LINE 台灣']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }
    // Fabricated head numbers (二度人脈 3,420 / 248 hard-coded etc.) absent.
    expect(screen.queryByText(/3,420/)).not.toBeInTheDocument();
    expect(screen.queryByText(/二度人脈/)).not.toBeInTheDocument();
    // KPI value for 已連結 is the real count (1), not the design's 248.
    const stat = screen.getByText('已連結', { selector: '.net-stat-l' });
    const card = stat.closest('.net-stat') as HTMLElement;
    expect(within(card).getByText('1')).toBeInTheDocument();
  });
});
