import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobBoardPage from './JobBoardPage';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useListings } from '../lib/query';

vi.mock('../lib/query', () => ({
  useListings: vi.fn(),
}));

const mockUseListings = vi.mocked(useListings);

const mockUser: AuthUser = {
  id: 'u1',
  email: 'new@example.com',
  displayName: 'New User',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 0,
  status: 'ACTIVE',
  emailVerified: false,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <JobBoardPage />
    </MemoryRouter>,
  );
}

function apiError(code: string) {
  return {
    response: {
      status: 403,
      data: { code },
    },
  };
}

describe('JobBoardPage — onboarding states', () => {
  beforeEach(() => {
    mockUseListings.mockReset();
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: null,
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  it('shows email verification onboarding instead of generic load failure for EMAIL_NOT_VERIFIED', () => {
    useAuthStore.setState({ user: { ...mockUser, emailVerified: false, kycTier: 0 } });
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: apiError('EMAIL_NOT_VERIFIED'),
    } as ReturnType<typeof useListings>);

    renderPage();

    expect(screen.getByText('請先驗證 Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看驗證信狀態' })).toBeInTheDocument();
    expect(screen.queryByText('載入失敗')).not.toBeInTheDocument();
  });

  it('shows KYC onboarding instead of generic load failure for KYC_TIER_REQUIRED', () => {
    useAuthStore.setState({ user: { ...mockUser, emailVerified: true, kycTier: 0 } });
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: apiError('KYC_TIER_REQUIRED'),
    } as ReturnType<typeof useListings>);

    renderPage();

    expect(screen.getByText('完成帳戶驗證後即可查看案件')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完成 KYC 認證' })).toBeInTheDocument();
    expect(screen.queryByText('載入失敗')).not.toBeInTheDocument();
  });

  it('shows the empty board state for a valid Tier1 user with no listings', () => {
    useAuthStore.setState({ user: { ...mockUser, emailVerified: true, kycTier: 1 } });
    mockUseListings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useListings>);

    renderPage();

    expect(screen.getByText('目前沒有案件')).toBeInTheDocument();
    expect(screen.queryByText('載入失敗')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '發布案件' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完成 KYC 認證以解鎖發布案件' })).toBeInTheDocument();
  });
});
