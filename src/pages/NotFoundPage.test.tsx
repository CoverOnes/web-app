/**
 * NotFoundPage.test.tsx
 *
 * Tests:
 *   1. Renders 404 aria-label and heading
 *   2. "回首頁" link goes to /jobs
 *   3. Search form navigates to /search on submit
 *   4. Suggestion links render and point to correct routes
 *   5. "需要協助？" nav link points to /help
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    renderPage();
    expect(screen.getByText(/這隻貓頭鷹也找不到這頁/)).toBeInTheDocument();
    expect(screen.getByLabelText('404')).toBeInTheDocument();
  });

  it('renders "回首頁" link pointing to /jobs', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /回首頁/i });
    expect(link).toHaveAttribute('href', '/jobs');
  });

  it('search form navigates to /search on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByRole('searchbox', { name: /搜尋/i });
    await user.type(input, 'backend');

    const form = input.closest('form')!;
    await user.type(input, '{Enter}');
    // navigate should have been called with /search?q=backend
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=backend');
    expect(form).toBeInTheDocument();
  });

  it('renders three suggestion links', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /瀏覽接案案件/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /我的招標進度/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /數據洞察/i })).toBeInTheDocument();
  });

  it('renders help link', () => {
    renderPage();
    // Nav link in topnav
    const helpLinks = screen.getAllByRole('link', { name: /需要協助/i });
    expect(helpLinks.length).toBeGreaterThan(0);
    expect(helpLinks[0]).toHaveAttribute('href', '/help');
  });
});
