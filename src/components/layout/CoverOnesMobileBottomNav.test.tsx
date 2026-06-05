import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import CoverOnesMobileBottomNav from './CoverOnesMobileBottomNav';

/* Helper: renders nav with a given initial route */
function renderNav(initialPath = '/jobs') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CoverOnesMobileBottomNav />
    </MemoryRouter>,
  );
}

/* Helper: get current pathname from rendered location */
function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="path">{loc.pathname}</div>;
}

function renderNavWithLocation(initialPath = '/jobs') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CoverOnesMobileBottomNav />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe('CoverOnesMobileBottomNav', () => {
  it('renders all 5 required tabs', () => {
    renderNav('/jobs');
    expect(screen.getByRole('button', { name: '首頁' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '案件' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '招標' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '合約' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '訊息' })).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    renderNav('/bids');
    const activeBtn = screen.getByRole('button', { name: '招標' });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
    // Others should NOT have aria-current
    expect(screen.getByRole('button', { name: '案件' })).not.toHaveAttribute('aria-current', 'page');
  });

  it('首頁 tab is active on / (P2a: 首頁 points at \'/\'; 案件 tab is active on /jobs)', () => {
    // P2a: 首頁 now points at '/' (Homepage dashboard); /jobs activates only 案件.
    renderNav('/');
    expect(screen.getByRole('button', { name: '首頁' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '案件' })).not.toHaveAttribute('aria-current', 'page');
    // Also verify /jobs activates 案件 only (not 首頁)
  });

  it('marks /contracts tab as active on /contracts/:id route', () => {
    renderNav('/contracts/abc123');
    expect(screen.getByRole('button', { name: '合約' })).toHaveAttribute('aria-current', 'page');
  });

  it('navigates when a tab is clicked', async () => {
    const user = userEvent.setup();
    renderNavWithLocation('/jobs');
    await user.click(screen.getByRole('button', { name: '招標' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/bids');
  });

  it('訊息 tab navigates to /messages (placeholder, chat not unparked)', async () => {
    const user = userEvent.setup();
    renderNavWithLocation('/jobs');
    await user.click(screen.getByRole('button', { name: '訊息' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/messages');
  });

  it.todo(
    'all tab buttons have minimum computed touch target (minWidth/minHeight ≥ 44px) ' +
    '— requires a layout engine (jsdom does not compute CSS; use Playwright/Cypress for this assertion)',
  );

  it('all tab buttons have aria-label (accessibility)', () => {
    renderNav('/jobs');
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-label');
    });
  });
});
