/**
 * PricingPage.test.tsx (Vitest + RTL)
 *
 * Cases:
 *   render:         page heading, all 4 plan cards, comparison table
 *   interaction:    billing toggle monthly/yearly switches displayed prices
 *   plan-cards:     Starter / Pro / Team / Enterprise cards are all rendered
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import PricingPage from './PricingPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );
}

// ─── render ──────────────────────────────────────────────────────────────────
describe('PricingPage — render', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent('選擇適合您企業規模的方案');
  });

  it('renders all four plan card labels', () => {
    renderPage();
    // Each plan name appears in the plan card and in the comparison table header
    expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Team').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the comparison table heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /完整方案比較/ }),
    ).toBeInTheDocument();
  });

  it('renders the FAQ section heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: '常見問題' }),
    ).toBeInTheDocument();
  });

  it('renders billing toggle buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '月付' })).toBeInTheDocument();
    // Yearly toggle button has accessible name starting with "年付"
    // (FAQ button "月付與年付怎麼選？" also contains 年付, so use ^ anchor to select just the toggle)
    const yearlyToggle = screen.getAllByRole('button', { name: /^年付/ });
    expect(yearlyToggle.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── interaction: billing toggle ─────────────────────────────────────────────
describe('PricingPage — billing toggle', () => {
  it('defaults to yearly billing and shows annual price for Pro', () => {
    renderPage();
    // yearly default: annualPrice(1580) = Math.round(1580 * 0.8) = 1264
    const priceEl = screen.getAllByText('1,264');
    expect(priceEl.length).toBeGreaterThanOrEqual(1);
  });

  it('switches to monthly billing and shows monthly price for Pro', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '月付' }));

    // monthly price: 1580
    const priceEl = screen.getAllByText('1,580');
    expect(priceEl.length).toBeGreaterThanOrEqual(1);
  });

  it('switches back to yearly billing after toggling', async () => {
    const user = userEvent.setup();
    renderPage();

    // switch to monthly
    await user.click(screen.getByRole('button', { name: '月付' }));
    // switch back to yearly (use getAllByRole and pick first: the toggle button)
    await user.click(screen.getAllByRole('button', { name: /^年付/ })[0]);

    // Pro yearly price: 1264
    const priceEl = screen.getAllByText('1,264');
    expect(priceEl.length).toBeGreaterThanOrEqual(1);
  });

  it('shows savings message when yearly is active', () => {
    renderPage();
    expect(screen.getAllByText('年付一次省 NT$ 3,792')[0]).toBeInTheDocument();
  });

  it('hides savings message when monthly is active', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '月付' }));

    expect(screen.queryByText('年付一次省 NT$ 3,792')).not.toBeInTheDocument();
  });
});

// ─── plan cards ──────────────────────────────────────────────────────────────
describe('PricingPage — plan cards', () => {
  it('renders Starter free pricing', () => {
    renderPage();
    expect(screen.getByText('免費')).toBeInTheDocument();
  });

  it('renders Starter register link pointing to /register', () => {
    renderPage();
    const link = screen.getByRole('link', { name: '免費註冊' });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders the most-popular badge on Pro card', () => {
    renderPage();
    expect(screen.getByText(/最受歡迎/)).toBeInTheDocument();
  });

  it('renders Enterprise contact email link', () => {
    renderPage();
    const link = screen.getByRole('link', { name: '預約專人介紹' });
    expect(link).toHaveAttribute('href', 'mailto:sales@coverones.com');
  });
});
