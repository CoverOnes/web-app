/**
 * DiscoverPage tests.
 *
 * Cases:
 *   render:      page heading renders, filter bar renders, breadcrumb shows, right-rail renders
 *   empty-state: company grid shows "尚無企業資料" empty-state (no backend API)
 *   interaction: removing an active filter chip removes it from the bar
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import DiscoverPage from './DiscoverPage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

function renderPage() {
  const Wrapper = makeWrapper();
  return render(
    <Wrapper>
      <DiscoverPage />
    </Wrapper>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiscoverPage', () => {
  // render: page heading
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('探索企業');
  });

  // render: breadcrumb
  it('renders breadcrumb text', () => {
    renderPage();
    expect(screen.getByText(/主選單 \/ 探索企業/)).toBeInTheDocument();
  });

  // render: filter bar search role
  it('renders the filter bar with search role', () => {
    renderPage();
    expect(screen.getByRole('search', { name: '篩選條件' })).toBeInTheDocument();
  });

  // empty-state: company grid shows empty-state (decision-A: no backend API)
  it('shows empty-state in company grid (no backend API)', () => {
    renderPage();
    expect(screen.getByText('尚無企業資料')).toBeInTheDocument();
    expect(screen.getByText(/企業探索功能需要後端/)).toBeInTheDocument();
  });

  // render: right-rail industry list
  it('renders the hot-industries right-rail section', () => {
    renderPage();
    expect(screen.getByText('熱門產業')).toBeInTheDocument();
    expect(screen.getByText('AI / 機器學習')).toBeInTheDocument();
    expect(screen.getByText('半導體')).toBeInTheDocument();
  });

  // render: geography distribution
  it('renders the geography distribution section', () => {
    renderPage();
    expect(screen.getByText('企業地理分布')).toBeInTheDocument();
    expect(screen.getByText('大台北')).toBeInTheDocument();
  });

  // render: profile suggestion card
  it('renders the profile suggestion card', () => {
    renderPage();
    expect(screen.getByText('為你建議')).toBeInTheDocument();
    expect(screen.getByText('完善公司檔案 →')).toBeInTheDocument();
  });

  // interaction: removing an active filter chip removes it from the DOM
  it('removes a filter chip when its remove button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    // Initial state: "產業：科技 / AI" chip is present
    expect(screen.getByText(/產業：科技 \/ AI/)).toBeInTheDocument();

    // Click the remove button on that chip
    const removeBtn = screen.getByRole('button', { name: /Remove 產業：科技 \/ AI filter/i });
    await user.click(removeBtn);

    // After removal, the chip should be gone
    expect(screen.queryByText(/產業：科技 \/ AI/)).not.toBeInTheDocument();
  });

  // render: sort and grid buttons present
  it('renders sort and grid view buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '排序選項' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '切換網格檢視' })).toBeInTheDocument();
  });
});
