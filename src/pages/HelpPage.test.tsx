/**
 * HelpPage.test.tsx
 *
 * Tests:
 *   1. Renders the hero section with search bar
 *   2. Category grid renders all 8 categories
 *   3. FAQ accordion expands / collapses on click
 *   4. Quick-search chips populate the search input
 *   5. Contact-support card is present
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HelpPage from './HelpPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <HelpPage />
    </MemoryRouter>,
  );
}

describe('HelpPage', () => {
  it('renders hero heading and search input', () => {
    renderPage();
    expect(screen.getByText('ChatOwl 幫助中心')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /搜尋幫助中心/i })).toBeInTheDocument();
  });

  it('renders 8 category buttons', () => {
    renderPage();
    // Each category is a <button> with aria-label
    const categories = [
      '入門指南',
      '公司管理',
      '專案 / 接案',
      '招標流程',
      '訊息與洽談',
      '付款與發票',
      '帳號安全',
      'API / 整合',
    ];
    for (const cat of categories) {
      expect(screen.getByRole('button', { name: cat })).toBeInTheDocument();
    }
  });

  it('first FAQ item is open by default and others are collapsed', () => {
    renderPage();
    // First question text is always visible
    expect(screen.getByText('如何發布專案 / 招標需求？')).toBeInTheDocument();
    // First answer text should be visible (accordion open)
    expect(screen.getByText(/登入後從首頁點/)).toBeInTheDocument();
    // Second question answer should NOT be visible initially
    expect(screen.queryByText(/營業登記證影本/)).not.toBeInTheDocument();
  });

  it('clicking a collapsed FAQ item expands it', async () => {
    const user = userEvent.setup();
    renderPage();

    // The second question is collapsed
    const secondBtn = screen.getByRole('button', { name: /公司認證需要什麼文件/i });
    expect(secondBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(secondBtn);

    expect(secondBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/營業登記證影本/)).toBeInTheDocument();
  });

  it('clicking a quick-search chip populates the search input', async () => {
    const user = userEvent.setup();
    renderPage();

    const chip = screen.getByRole('button', { name: '付款與退費' });
    await user.click(chip);

    const searchInput = screen.getByRole('searchbox', { name: /搜尋幫助中心/i });
    expect(searchInput).toHaveValue('付款與退費');
  });

  it('renders the contact support card', () => {
    renderPage();
    expect(screen.getByText('💬 還沒找到答案？')).toBeInTheDocument();
    expect(screen.getByText('support@chatowl.tw')).toBeInTheDocument();
  });
});
