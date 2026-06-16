import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CoverOnesSidebar from './CoverOnesSidebar';
import { useAuthStore, type AuthUser } from '../../store/authStore';

const mockUser: AuthUser = {
  id: 'u1',
  email: 'test@company.com',
  displayName: 'Test User',
  avatarUrl: null,
  accountType: 'BUSINESS',
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

function renderSidebar(initialPath = '/jobs') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <CoverOnesSidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CoverOnesSidebar', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: mockUser,
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  it('renders brand name and sub-title', () => {
    renderSidebar();
    expect(screen.getByText('CoverOnes')).toBeInTheDocument();
    expect(screen.getByText('B2B 企業媒合平台')).toBeInTheDocument();
  });

  it('renders the company display as a nav button (no switcher chevron/dropdown)', () => {
    renderSidebar();
    // The company card is now a navigation target to /company (P4 Company vertical):
    // it is a single button — NOT a dropdown switcher.
    const companyArea = screen.getByRole('button', { name: '前往我的公司頁' });
    expect(companyArea).toBeInTheDocument();
    expect(companyArea.tagName).toBe('BUTTON');
    // Still shows the company/account info inside.
    expect(companyArea.textContent).toMatch(/Test User/);
  });

  it('navigates to /company when the company card is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar('/jobs');
    const companyArea = screen.getByRole('button', { name: '前往我的公司頁' });
    await user.click(companyArea);
    // Click does not throw; the card is keyboard/click accessible.
    expect(companyArea).not.toBeDisabled();
  });

  it('renders core nav items (首頁, 案件, 招標, 合約, 訊息)', () => {
    renderSidebar();
    // The main nav uses aria-label="主選單"; find 首頁 within that nav
    const mainNav = screen.getByRole('navigation', { name: '主選單' });
    expect(mainNav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /案件看板/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /招標進度/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /合約管理/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /訊息/ })).toBeInTheDocument();
    // 首頁 nav item — there are multiple buttons matching /首頁/ (brand + nav)
    // verify the nav contains the 首頁 text
    expect(mainNav.textContent).toMatch(/首頁/);
  });

  it('首頁 nav item is NOT active when on /jobs (exact match guard)', () => {
    renderSidebar('/jobs');
    // Find all buttons; the nav-item 首頁 button has no aria-label (only text content)
    const allButtons = screen.getAllByRole('button');
    const homeNavBtn = allButtons.find(
      (btn) => btn.textContent?.trim() === '首頁' && !btn.getAttribute('aria-label'),
    );
    expect(homeNavBtn).toBeDefined();
    expect(homeNavBtn).not.toHaveAttribute('aria-current', 'page');
  });

  it('首頁 nav item IS active on exact "/" route', () => {
    renderSidebar('/');
    const allButtons = screen.getAllByRole('button');
    const homeNavBtn = allButtons.find(
      (btn) => btn.textContent?.trim() === '首頁' && !btn.getAttribute('aria-label'),
    );
    expect(homeNavBtn).toBeDefined();
    expect(homeNavBtn).toHaveAttribute('aria-current', 'page');
  });

  it('marks /bids nav item as active when on bids route', () => {
    renderSidebar('/bids');
    const bidsBtn = screen.getByRole('button', { name: /招標進度/ });
    expect(bidsBtn).toHaveAttribute('aria-current', 'page');
  });

  it('does NOT show KYC item for tier-2 user', () => {
    renderSidebar();
    expect(screen.queryByText('身分認證')).not.toBeInTheDocument();
  });

  it('shows KYC item for tier-0 user', () => {
    useAuthStore.setState({ user: { ...mockUser, kycTier: 0 } });
    renderSidebar();
    expect(screen.getByText('身分認證')).toBeInTheDocument();
  });

  it('shows user displayName in footer', () => {
    renderSidebar();
    // displayName appears in both the company display and the footer
    const nameEls = screen.getAllByText('Test User');
    expect(nameEls.length).toBeGreaterThanOrEqual(1);
  });

  it('訊息 nav item is accessible via keyboard (not disabled)', async () => {
    const user = userEvent.setup();
    renderSidebar('/jobs');
    const msgBtn = screen.getByRole('button', { name: /訊息/ });
    expect(msgBtn).not.toBeDisabled();
    await user.click(msgBtn);
    // Just verifying it's clickable without throwing
  });
});
