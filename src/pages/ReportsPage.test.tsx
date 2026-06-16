/**
 * ReportsPage tests (Vitest + RTL).
 *
 * Cases:
 *   render:       page heading + breadcrumb + empty-states
 *   render:       "尚無產業報告" / "尚無精選報告" present (no fake report cards)
 *   interaction:  PRO-upsell visibility flips with the REAL KYC tier
 *                 (kycTier 0 → 升級 shown; kycTier 2 → 已是進階會員)
 *   no-fake-data: every fabricated mockup number is ABSENT from the DOM
 *
 * ReportsPage reads only useAuthStore().user.kycTier — no query hooks — so we
 * drive state via useAuthStore.setState (no vi.mock of ../lib/query needed).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from './ReportsPage';
import { useAuthStore, type AuthUser } from '../store/authStore';

function makeUser(kycTier: number): AuthUser {
  return {
    id: 'me-0001',
    email: 'me@example.com',
    displayName: 'Wayne',
    avatarUrl: null,
    accountType: 'COMPANY',
    kycTier,
    status: 'ACTIVE',
    emailVerified: true,
  };
}

function setUser(kycTier: number) {
  useAuthStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: makeUser(kycTier),
    isAuthenticated: true,
    isHydrating: false,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setUser(0);
});

describe('ReportsPage', () => {
  it('renders the page heading and breadcrumb', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('產業報告');
    expect(screen.getByText('主選單 / 產業報告')).toBeInTheDocument();
  });

  it('renders honest empty-states instead of fabricated report cards', () => {
    renderPage();
    expect(screen.getByText('尚無精選報告')).toBeInTheDocument();
    expect(screen.getByText('尚無產業報告')).toBeInTheDocument();
    expect(screen.getByText('尚無熱門報告')).toBeInTheDocument();
    expect(screen.getByText('尚無平台數據')).toBeInTheDocument();
  });

  it('shows the upsell (inert CTA) when kycTier is below the PRO threshold', () => {
    setUser(0);
    renderPage();
    expect(screen.getByText('升級進階會員')).toBeInTheDocument();
    // CTA is rendered but disabled (no billing backend).
    const cta = screen.getByRole('button', { name: '升級方案即將推出' });
    expect(cta).toBeDisabled();
    // Entitled state must NOT show.
    expect(screen.queryByText('已是進階會員')).not.toBeInTheDocument();
  });

  it('hides the upsell and shows entitled state when kycTier >= 2', () => {
    setUser(2);
    renderPage();
    expect(screen.getByText('已是進階會員')).toBeInTheDocument();
    expect(screen.queryByText('升級進階會員')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '升級方案即將推出' })).not.toBeInTheDocument();
  });

  it('does NOT render any fabricated platform/report numbers', () => {
    renderPage();
    const fakeNumbers = [
      /18\.4M/, /8,420/, /\b428\b/, /182K/, /12 ?\/ ?42/, /142 則/, /1,840/,
      /NT\$ ?1,580/, /5,180/, /3,742/, /\+ ?42/, /168 頁/, /67%/,
    ];
    for (const re of fakeNumbers) {
      expect(screen.queryByText(re)).not.toBeInTheDocument();
    }
    // Fabricated report titles from Reports.html must be absent.
    for (const fake of ['台灣 B2B SaaS 採購行為深度報告', '企業 LLM 應用落地', '智慧工廠 ROI 分析', '智慧醫療採購趨勢']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }
  });
});
