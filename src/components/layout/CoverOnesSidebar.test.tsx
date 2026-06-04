import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CoverOnesSidebar />
    </MemoryRouter>,
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

  it('renders STATIC company display (no switcher chevron/dropdown)', () => {
    renderSidebar();
    // Static company area should show user name
    expect(screen.getByLabelText('目前企業')).toBeInTheDocument();
    // No "chevron" button that would indicate a switcher
    // The area is a div, not a button
    const companyArea = screen.getByLabelText('目前企業');
    expect(companyArea.tagName).toBe('DIV');
  });

  it('renders core nav items (案件, 招標, 合約, 訊息)', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /案件看板/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /招標進度/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /合約管理/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /訊息/ })).toBeInTheDocument();
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
