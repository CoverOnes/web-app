/**
 * InsightsPage tests (Vitest + RTL).
 *
 * Cases:
 *   render:       page heading + 2 real KPI cards from mocked hook lengths
 *   render:       network graph empty-state (n=0) "尚無連結"
 *   render:       trend/industry/heatmap panels show "尚無足夠資料" empty-states
 *   no-fake-data: every fabricated mockup number/name is ABSENT from the DOM,
 *                 and NO trend bars (.tb) / heatmap cells (.cell) are rendered.
 *
 * The connection hooks are mocked (mirrors NetworkPage.test.tsx).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import InsightsPage from './InsightsPage';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useConnections, usePendingInvites } from '../lib/query';
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
}));

const mockUseConnections = vi.mocked(useConnections);
const mockUsePendingInvites = vi.mocked(usePendingInvites);

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

function makeConnection(id: string, displayName: string): Connection {
  return {
    id,
    user: {
      userId: `u-${id}`,
      displayName,
      handle: null,
      headline: null,
      avatarUrl: null,
      accountType: 'COMPANY',
    },
    connectedAt: '2026-06-01T00:00:00Z',
    degree: 1,
  };
}

function makeInvite(id: string): PendingInvite {
  return {
    id,
    user: {
      userId: `u-${id}`,
      displayName: `Inviter ${id}`,
      handle: null,
      headline: null,
      avatarUrl: null,
      accountType: 'PERSONAL',
    },
    createdAt: '2026-06-10T00:00:00Z',
  };
}

function queryStub<T>(data: T | undefined, opts: Partial<{ isLoading: boolean; isError: boolean }> = {}) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as unknown as ReturnType<typeof useConnections>;
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
  return render(<InsightsPage />, { wrapper: makeWrapper() });
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
  mockUseConnections.mockReturnValue(queryStub({ connections: [] }));
  mockUsePendingInvites.mockReturnValue(
    queryStub({ incoming: [], outgoing: [] }) as unknown as ReturnType<typeof usePendingInvites>,
  );
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('InsightsPage', () => {
  it('renders the page heading and breadcrumb', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('數據洞察');
    expect(screen.getByText('主選單 / 數據洞察')).toBeInTheDocument();
  });

  it('renders exactly the 2 real KPI values derived from mocked hook lengths', () => {
    // 3 accepted connections, 2 incoming invites → KPI shows 3 and 2.
    mockUseConnections.mockReturnValue(
      queryStub({ connections: [makeConnection('1', 'Alpha'), makeConnection('2', 'Beta'), makeConnection('3', 'Gamma')] }),
    );
    mockUsePendingInvites.mockReturnValue(
      queryStub({ incoming: [makeInvite('a'), makeInvite('b')], outgoing: [] }) as unknown as ReturnType<typeof usePendingInvites>,
    );
    renderPage();

    const accepted = screen.getByText('已連結', { selector: '.ins-kpi-l' });
    expect(within(accepted.closest('.ins-kpi') as HTMLElement).getByText('3')).toBeInTheDocument();

    const pending = screen.getByText('待處理邀請', { selector: '.ins-kpi-l' });
    expect(within(pending.closest('.ins-kpi') as HTMLElement).getByText('2')).toBeInTheDocument();
  });

  it('shows the graph empty-state when there are no connections', () => {
    renderPage();
    expect(screen.getByText('尚無連結')).toBeInTheDocument();
  });

  it('renders honest empty-states for the trend / industry / heatmap panels', () => {
    renderPage();
    // The trend panel uses a distinct message; industry + heatmap share one.
    expect(screen.getByText('尚無足夠資料以繪製趨勢')).toBeInTheDocument();
    expect(screen.getAllByText('尚無足夠資料').length).toBeGreaterThanOrEqual(2);
    // Panel headings still present for layout fidelity.
    expect(screen.getByText('招標金額趨勢')).toBeInTheDocument();
    expect(screen.getByText('產業熱度排行')).toBeInTheDocument();
    expect(screen.getByText('投標活動熱力圖')).toBeInTheDocument();
  });

  it('does NOT render any fabricated mockup numbers, names, or chart elements', () => {
    mockUseConnections.mockReturnValue(queryStub({ connections: [makeConnection('1', 'Alpha')] }));
    const { container } = renderPage();

    // Fabricated KPI / AI-insight / industry numbers from Insights.html.
    const fakeNumbers = [
      /18\.4M/, /28\.6%/, /3,128/, /94 ?\/ ?100/, /142 案/, /\+38%/, /\b218\b/,
      /32\.4%/, /\+75%/, /8\.4M/, /\b612\b/, /TOP 5%/,
    ];
    for (const re of fakeNumbers) {
      expect(screen.queryByText(re)).not.toBeInTheDocument();
    }

    // Fabricated company node names from the mockup graph.
    for (const fake of ['台積電子', '沛星互動', '中華電信', '玉山銀行', '誠品文創', '綠源資安', 'Appier', 'iKala']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }

    // No CSS trend bars and no heatmap cells (rendering them = fake visual data).
    expect(container.querySelector('.tb')).toBeNull();
    expect(container.querySelector('.cell')).toBeNull();
    expect(container.querySelector('.heat')).toBeNull();
  });
});
