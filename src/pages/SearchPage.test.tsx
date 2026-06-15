/**
 * SearchPage tests
 * Covers: render (loading / results / empty), user interaction (tab switch, search submit), error state.
 * No testing-library/no-node-access violations — all queries use getByRole / getByText / findByText.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchPage from './SearchPage';
import { useListings } from '../lib/query';
import type { Listing } from '../lib/api/coverones';

vi.mock('../lib/query', () => ({
  useListings: vi.fn(),
}));

const mockUseListings = vi.mocked(useListings);

const mockListings: Listing[] = [
  {
    id: 'l1',
    ownerUserId: 'u1',
    title: 'React 前端工程師外包案',
    description: '需要有 React 和 TypeScript 經驗的工程師協助開發電商後台。',
    budgetMin: '80000',
    budgetMax: '150000',
    currency: 'TWD',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'l2',
    ownerUserId: 'u2',
    title: 'Python 資料分析顧問',
    description: '協助分析零售業銷售數據，建立自動化報表。',
    budgetMin: '50000',
    budgetMax: '100000',
    currency: 'TWD',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: 'l3',
    ownerUserId: 'u3',
    title: '品牌設計專案',
    description: '提供品牌識別設計、logo 及視覺規範。',
    budgetMin: null,
    budgetMax: '60000',
    currency: 'TWD',
    status: 'CLOSED',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

function renderSearch(q?: string) {
  const initialEntry = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/jobs/:id" element={<div>Job Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SearchPage — render', () => {
  beforeEach(() => {
    mockUseListings.mockReset();
  });

  it('renders loading skeletons while data is pending', () => {
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    renderSearch('React');
    // Skeleton divs are aria-hidden but the search input should still be visible
    expect(screen.getByRole('searchbox', { name: '搜尋關鍵字' })).toBeDefined();
  });

  it('renders listing results when data is available', async () => {
    mockUseListings.mockReturnValue({
      data: mockListings,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    renderSearch();
    // Both OPEN listings should be visible (default status filter = OPEN).
    // Use textContent matcher because Highlighted splits text into multiple nodes.
    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.textContent === 'React 前端工程師外包案')).toBeDefined();
      expect(screen.getByText((_, el) => el?.textContent === 'Python 資料分析顧問')).toBeDefined();
    });
    // CLOSED listing filtered out by default status filter
    expect(screen.queryByText((_, el) => el?.textContent === '品牌設計專案')).toBeNull();
  });

  it('filters by search query q=React', async () => {
    mockUseListings.mockReturnValue({
      data: mockListings,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    renderSearch('React');
    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.textContent === 'React 前端工程師外包案')).toBeDefined();
    });
    // Python listing should NOT match "React" query
    expect(screen.queryByText((_, el) => el?.textContent === 'Python 資料分析顧問')).toBeNull();
  });

  it('shows empty state when no listings match query', async () => {
    mockUseListings.mockReturnValue({
      data: mockListings,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    renderSearch('xyznotfound');
    await waitFor(() => {
      expect(screen.getByText(/找不到符合/)).toBeDefined();
    });
  });

  it('shows error empty state when API fails', async () => {
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network error'),
    } as ReturnType<typeof useListings>);

    renderSearch();
    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeDefined();
    });
  });
});

describe('SearchPage — user interaction', () => {
  beforeEach(() => {
    mockUseListings.mockReset();
    mockUseListings.mockReturnValue({
      data: mockListings,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);
  });

  it('switches to 公司 tab and shows empty-state', async () => {
    renderSearch();
    const companiesTab = screen.getByRole('tab', { name: /公司/ });
    fireEvent.click(companiesTab);
    await waitFor(() => {
      expect(screen.getByText('尚無公司搜尋來源')).toBeDefined();
    });
  });

  it('switches to 人才 tab and shows empty-state', async () => {
    renderSearch();
    const peopleTab = screen.getByRole('tab', { name: /人才/ });
    fireEvent.click(peopleTab);
    await waitFor(() => {
      expect(screen.getByText('尚無人才搜尋來源')).toBeDefined();
    });
  });

  it('submits search form and navigates to ?q=', async () => {
    renderSearch();
    const input = screen.getByRole('searchbox', { name: '搜尋關鍵字' });
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.submit(screen.getByRole('search', { name: '全站搜尋' }));

    // After submit, listings tab should still be active and Python result visible.
    // Use textContent matcher because Highlighted splits text into multiple nodes.
    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.textContent === 'Python 資料分析顧問')).toBeDefined();
    });
  });

  it('clears search when X button clicked', async () => {
    renderSearch('React');
    // All OPEN listings should show after clear.
    const clearBtn = screen.getByRole('button', { name: '清除搜尋' });
    fireEvent.click(clearBtn);
    await waitFor(() => {
      // After clearing, no active q → both OPEN listings match status=OPEN filter.
      // Use textContent matcher because titles may be plain text here (no highlight).
      expect(screen.getByText((_, el) => el?.textContent === 'React 前端工程師外包案')).toBeDefined();
      expect(screen.getByText((_, el) => el?.textContent === 'Python 資料分析顧問')).toBeDefined();
    });
  });

  it('clicking related query button updates search', async () => {
    renderSearch();
    // Related query pill "AI 開發" should be visible
    const pill = screen.getByRole('button', { name: 'AI 開發' });
    fireEvent.click(pill);
    // After click, input should show "AI 開發"
    const input = screen.getByRole('searchbox', { name: '搜尋關鍵字' });
    expect((input as HTMLInputElement).value).toBe('AI 開發');
  });
});

describe('SearchPage — accessibility', () => {
  beforeEach(() => {
    mockUseListings.mockReturnValue({
      data: mockListings,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);
  });

  it('search form has accessible role and label', () => {
    renderSearch();
    expect(screen.getByRole('search', { name: '全站搜尋' })).toBeDefined();
  });

  it('tabs have correct aria attributes', () => {
    renderSearch();
    const listingsTab = screen.getByRole('tab', { name: /案件/ });
    expect(listingsTab.getAttribute('aria-selected')).toBe('true');
    const companiesTab = screen.getByRole('tab', { name: /公司/ });
    expect(companiesTab.getAttribute('aria-selected')).toBe('false');
  });

  it('tab panel has correct aria-labelledby', () => {
    renderSearch();
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe('search-tab-listings');
  });
});
