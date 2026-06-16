/**
 * SavedPage tests (Vitest + RTL).
 *
 * UI cases (mocked hooks):
 *   render:       2 tabs (儲存的案件 / 追蹤的公司) with live counts
 *   empty-state:  jobs empty → CTA navigates /jobs; companies empty → CTA /discover
 *   render:       saved company card shows name + industry from mock (no fabricated text)
 *   interaction:  star ★ on a company card fires the toggle mutation (currentlySaved=true)
 *   error:        toggle isError → inline "操作失敗，請稍後再試。"
 *   no-fake-data: Saved.html sample names/numbers (玉山/沛星/屈臣氏/18) absent from DOM
 *
 * Optimistic toggle cases (REAL useToggleSaved + real QueryClient + spied savedApi):
 *   success:      onMutate removes the item; it stays removed after the request resolves
 *   error-REVERT: onMutate removes the item, then onError restores it to the prior cache
 *
 * The page-level hooks are mocked for the UI cases (mirrors NetworkPage.test.tsx).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import SavedPage from './SavedPage';
import { useSavedJobs, useSavedCompanies, useToggleSaved, useListing } from '../lib/query';
import { savedApi } from '../lib/api/coverones';
import type {
  SavedJobRef,
  SavedCompany,
  Listing,
  ListSavedCompaniesResponse,
} from '../lib/api/coverones';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Mocks (only the page-level hooks; UI cases) ────────────────────────────────
// The REAL useToggleSaved is captured under __realUseToggleSaved so the optimistic
// tests can exercise the genuine onMutate/onError/onSettled logic against a real
// QueryClient, while the page-level UI tests use the vi.fn() stub.
vi.mock('../lib/query', async () => {
  const actual = await vi.importActual<typeof import('../lib/query')>('../lib/query');
  return {
    ...actual,
    __realUseToggleSaved: actual.useToggleSaved,
    useSavedJobs: vi.fn(),
    useSavedCompanies: vi.fn(),
    useToggleSaved: vi.fn(),
    useListing: vi.fn(),
  };
});

const mockUseSavedJobs = vi.mocked(useSavedJobs);
const mockUseSavedCompanies = vi.mocked(useSavedCompanies);
const mockUseToggleSaved = vi.mocked(useToggleSaved);
const mockUseListing = vi.mocked(useListing);

// ─── Fixtures ──────────────────────────────────────────────────────────────────
function makeJobRef(over: Partial<SavedJobRef> = {}): SavedJobRef {
  return {
    savedId: 'sv-job-1',
    itemType: 'job',
    itemId: 'listing-1',
    savedAt: '2026-06-10T00:00:00Z',
    ...over,
  };
}

function makeListing(over: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    ownerUserId: 'owner-1',
    title: 'AI 客服機器人開發案',
    description: 'desc',
    budgetMin: '500000',
    budgetMax: '900000',
    currency: 'NT$',
    status: 'OPEN',
    createdAt: '2026-06-01T00:00:00Z',
    ...over,
  };
}

function makeSavedCompany(over: Partial<SavedCompany> = {}): SavedCompany {
  return {
    savedId: 'sv-co-1',
    itemType: 'company',
    itemId: 'co-1',
    savedAt: '2026-06-05T00:00:00Z',
    company: {
      id: 'co-1',
      handle: 'acme',
      name: '宏碁智慧',
      tagline: '企業 AI 解決方案',
      location: '台北',
      industry: '軟體',
      companySize: '200+ 人',
      logoUrl: null,
    },
    ...over,
  };
}

// query-result stub (only the fields the page reads).
function queryStub<T>(data: T | undefined, opts: Partial<{ isLoading: boolean; isError: boolean }> = {}) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as unknown as ReturnType<typeof useSavedJobs>;
}

function mutationStub(over: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    ...over,
  } as unknown as ReturnType<typeof useToggleSaved>;
}

function listingStub(data: Listing | undefined, opts: Partial<{ isLoading: boolean; isError: boolean }> = {}) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
  } as unknown as ReturnType<typeof useListing>;
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
  return render(<SavedPage />, { wrapper: makeWrapper() });
}

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  // Default: both lists empty — individual tests override.
  mockUseSavedJobs.mockReturnValue(queryStub({ items: [] }));
  mockUseSavedCompanies.mockReturnValue(
    queryStub({ items: [] }) as unknown as ReturnType<typeof useSavedCompanies>,
  );
  mockUseToggleSaved.mockReturnValue(mutationStub());
  mockUseListing.mockReturnValue(listingStub(makeListing()));
});

// ════════════════════════════════════════════════════════════════════════════
// UI tests
// ════════════════════════════════════════════════════════════════════════════
describe('SavedPage — UI', () => {
  it('renders 2 tabs with live counts and the page heading', () => {
    mockUseSavedJobs.mockReturnValue(queryStub({ items: [makeJobRef()] }));
    mockUseSavedCompanies.mockReturnValue(
      queryStub({ items: [makeSavedCompany()] }) as unknown as ReturnType<typeof useSavedCompanies>,
    );
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('收藏夾');
    const tablist = screen.getByRole('tablist');
    expect(within(tablist).getByRole('tab', { name: /儲存的案件/ })).toBeInTheDocument();
    expect(within(tablist).getByRole('tab', { name: /追蹤的公司/ })).toBeInTheDocument();
    // subtitle = 共 2 個收藏 (1 job + 1 company)
    expect(
      screen.getByText((_c, el) => el?.tagName === 'P' && /共\s*2\s*個收藏/.test(el.textContent ?? '')),
    ).toBeInTheDocument();
  });

  it('shows the jobs empty-state with a CTA that navigates to /jobs', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText('尚未儲存任何案件')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /瀏覽案件看板/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  it('shows the companies empty-state with a CTA that navigates to /discover', async () => {
    const user = userEvent.setup();
    renderPage();
    // switch to the companies tab (default is jobs)
    await user.click(screen.getByRole('tab', { name: /追蹤的公司/ }));
    expect(screen.getByText('尚未追蹤任何公司')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /探索企業/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/discover');
  });

  it('renders a saved company card with its name and industry from the mock', async () => {
    mockUseSavedCompanies.mockReturnValue(
      queryStub({ items: [makeSavedCompany()] }) as unknown as ReturnType<typeof useSavedCompanies>,
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /追蹤的公司/ }));
    expect(screen.getByText('宏碁智慧')).toBeInTheDocument();
    expect(screen.getByText('軟體 · 200+ 人')).toBeInTheDocument();
    expect(screen.getByText('企業 AI 解決方案')).toBeInTheDocument();
  });

  it('hydrates a saved job card via useListing and renders its real title + price', () => {
    mockUseSavedJobs.mockReturnValue(queryStub({ items: [makeJobRef()] }));
    renderPage();
    expect(screen.getByText('AI 客服機器人開發案')).toBeInTheDocument();
    expect(screen.getByText('NT$ 500000 – 900000')).toBeInTheDocument();
    expect(screen.getByText('開放中')).toBeInTheDocument();
  });

  it('skips a saved job whose listing 404s (resolve-on-read; renders nothing)', () => {
    mockUseSavedJobs.mockReturnValue(queryStub({ items: [makeJobRef()] }));
    mockUseListing.mockReturnValue(listingStub(undefined, { isError: true }));
    renderPage();
    // No card title, and the empty-state does NOT appear (the list is non-empty).
    expect(screen.queryByText('AI 客服機器人開發案')).not.toBeInTheDocument();
    expect(screen.queryByText('尚未儲存任何案件')).not.toBeInTheDocument();
  });

  it('fires the toggle mutation with currentlySaved=true when the star is clicked', async () => {
    const toggleMutate = vi.fn();
    mockUseSavedCompanies.mockReturnValue(
      queryStub({ items: [makeSavedCompany()] }) as unknown as ReturnType<typeof useSavedCompanies>,
    );
    mockUseToggleSaved.mockReturnValue(mutationStub({ mutate: toggleMutate }));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /追蹤的公司/ }));
    await user.click(screen.getByRole('button', { name: /取消追蹤「宏碁智慧」/ }));
    expect(toggleMutate).toHaveBeenCalledTimes(1);
    expect(toggleMutate.mock.calls[0][0]).toEqual({ itemId: 'co-1', currentlySaved: true });
  });

  it('surfaces a toggle error inline as "操作失敗，請稍後再試。"', () => {
    mockUseSavedJobs.mockReturnValue(queryStub({ items: [makeJobRef()] }));
    mockUseToggleSaved.mockReturnValue(mutationStub({ isError: true }));
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('操作失敗，請稍後再試。');
  });

  it('does NOT render any Saved.html sample names or fabricated counts', () => {
    mockUseSavedJobs.mockReturnValue(queryStub({ items: [makeJobRef()] }));
    mockUseSavedCompanies.mockReturnValue(
      queryStub({ items: [makeSavedCompany()] }) as unknown as ReturnType<typeof useSavedCompanies>,
    );
    renderPage();
    // Fabricated company / project names from Saved.html with no backing data.
    for (const fake of ['沛星互動', '玉山銀行', '屈臣氏', '超對稱科技', '王允中', 'Appier']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }
    // Fabricated counts (全部收藏 18 / 公司 7 / 載入更多) absent.
    expect(screen.queryByText(/載入更多/)).not.toBeInTheDocument();
    expect(screen.queryByText(/最近瀏覽/)).not.toBeInTheDocument();
    // The subtitle count is the REAL total (2), not the design's 18.
    expect(screen.queryByText(/共\s*18\s*個收藏/)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Optimistic toggle (REAL useToggleSaved + real QueryClient + spied savedApi)
// ════════════════════════════════════════════════════════════════════════════
describe('useToggleSaved — optimistic toggle + revert-on-error', () => {
  // Pull the REAL hook captured in the mock factory above.
  let realUseToggleSaved: typeof useToggleSaved;

  function seededClient(items: SavedCompany[]) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    qc.setQueryData<ListSavedCompaniesResponse>(['saved', 'company'], { items });
    return qc;
  }

  function hookWrapper(qc: QueryClient) {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  }

  beforeEach(async () => {
    const mod = (await import('../lib/query')) as unknown as {
      __realUseToggleSaved: typeof useToggleSaved;
    };
    realUseToggleSaved = mod.__realUseToggleSaved;
  });

  it('SUCCESS: optimistically removes the item and it stays removed after settle', async () => {
    const company = makeSavedCompany();
    const qc = seededClient([company]);
    const unsaveSpy = vi
      .spyOn(savedApi, 'unsave')
      .mockResolvedValue({ itemType: 'company', itemId: 'co-1', removed: true });

    const { result } = renderHook(() => realUseToggleSaved('company'), {
      wrapper: hookWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ itemId: 'co-1', currentlySaved: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(unsaveSpy).toHaveBeenCalledWith('company', 'co-1');
    // After settle the optimistic removal sticks (invalidate refetch is a no-op
    // here since there is no queryFn registered, so the cache keeps the value).
    const data = qc.getQueryData<ListSavedCompaniesResponse>(['saved', 'company']);
    expect(data?.items.find((i) => i.itemId === 'co-1')).toBeUndefined();

    unsaveSpy.mockRestore();
  });

  it('ERROR: optimistically removes the item then REVERTS it on API error', async () => {
    const company = makeSavedCompany();
    const qc = seededClient([company]);
    const unsaveSpy = vi.spyOn(savedApi, 'unsave').mockRejectedValue({
      response: { data: { error: { code: 'SAVED_ITEM_EXISTS' } } },
    });

    const { result } = renderHook(() => realUseToggleSaved('company'), {
      wrapper: hookWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ itemId: 'co-1', currentlySaved: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // The card was REVERTED — co-1 is back in the cache exactly as before.
    const data = qc.getQueryData<ListSavedCompaniesResponse>(['saved', 'company']);
    expect(data?.items).toHaveLength(1);
    expect(data?.items[0]).toEqual(company);

    unsaveSpy.mockRestore();
  });
});
