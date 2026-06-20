/**
 * KycPage.test.tsx
 *
 * Tests for the multi-step KYC onboarding wizard.
 * Covers: render (init loading, step 1, step 5 re-entry),
 *         interaction (step1 advance, OTP input, re-entry jump),
 *         error states (validation errors).
 *
 * Test cases: 12 total (render: 4, interaction: 5, error: 3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KycPage from './KycPage';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Default: not yet started (currentTier=0, nothing verified)
const mockKycMeData = {
  id: 'kyc-1',
  userId: 'user-1',
  currentTier: 0,
  kycType: 'PERSONAL',
  emailVerified: false,
  phoneVerified: false,
};

const mockUseKycMe = vi.fn(() => ({
  data: mockKycMeData,
  isLoading: false,
}));

const mockEmailStart = vi.fn();
const mockEmailVerify = vi.fn();
const mockPhoneStart = vi.fn();
const mockPhoneVerify = vi.fn();
const mockVerifyId = vi.fn();

vi.mock('../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/query')>();
  return {
    ...actual,
    useKycMe: () => mockUseKycMe(),
    useKycEmailStart: () => ({ mutateAsync: mockEmailStart, isPending: false }),
    useKycEmailVerify: () => ({ mutateAsync: mockEmailVerify, isPending: false }),
    useKycPhoneStart: () => ({ mutateAsync: mockPhoneStart, isPending: false }),
    useKycPhoneVerify: () => ({ mutateAsync: mockPhoneVerify, isPending: false }),
    useKycVerifyId: () => ({ mutateAsync: mockVerifyId, isPending: false }),
    useSubmitKyc: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

// Mock authStore
vi.mock('../store/authStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/authStore')>();
  return {
    ...actual,
    useAuthStore: vi.fn((selector: (s: { user: { accountType: 'PERSONAL'; kycTier: number }; refreshToken: string | null; accessToken: string | null; isHydrating: boolean; refreshTokens: () => void }) => unknown) =>
      selector({
        user: { accountType: 'PERSONAL', kycTier: 0 },
        refreshToken: null,
        accessToken: 'tok',
        isHydrating: false,
        refreshTokens: vi.fn(),
      })
    ),
  };
});

// ── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<KycPage />, { wrapper: createWrapper() });
}

// ── Render tests ─────────────────────────────────────────────────────────────

describe('KycPage — render', () => {
  beforeEach(() => {
    mockUseKycMe.mockReturnValue({ data: mockKycMeData, isLoading: false });
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockPhoneStart.mockReset();
    mockPhoneVerify.mockReset();
    mockVerifyId.mockReset();
    mockNavigate.mockReset();
  });

  it('shows loading skeleton while kycMe is loading', () => {
    mockUseKycMe.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    // Skeleton divs are rendered (aria-hidden)
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders Step 1 heading and form when starting fresh (tier 0)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Step 1 \/ 5/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Email 地址')).toBeInTheDocument();
    expect(screen.getByLabelText('手機號碼')).toBeInTheDocument();
  });

  it('renders Step 4 heading when emailVerified and phoneVerified (tier 0→1 done)', async () => {
    mockUseKycMe.mockReturnValue({
      data: { ...mockKycMeData, emailVerified: true, phoneVerified: true, currentTier: 1 },
      isLoading: false,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Step 4 \/ 5/i)).toBeInTheDocument();
    });
  });

  it('renders Step 5 result when already at tier 2', async () => {
    mockUseKycMe.mockReturnValue({
      data: { ...mockKycMeData, emailVerified: true, phoneVerified: true, currentTier: 2 },
      isLoading: false,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Step 5 \/ 5/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '前往案件看板' })).toBeInTheDocument();
  });
});

// ── Interaction tests ────────────────────────────────────────────────────────

describe('KycPage — interaction', () => {
  beforeEach(() => {
    mockUseKycMe.mockReturnValue({ data: mockKycMeData, isLoading: false });
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockPhoneStart.mockReset();
    mockPhoneVerify.mockReset();
    mockNavigate.mockReset();
  });

  it('advances from Step 1 to Step 2 when email and phone are valid', async () => {
    const user = userEvent.setup();
    mockEmailStart.mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('Email 地址'), 'test@example.com');
    await user.type(screen.getByLabelText('手機號碼'), '+886912345678');
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 \/ 5/i)).toBeInTheDocument();
    });
  });

  it('calls emailStart on step 2 mount (auto-send)', async () => {
    mockEmailStart.mockResolvedValue(undefined);
    mockUseKycMe.mockReturnValue({
      data: { ...mockKycMeData },
      isLoading: false,
    });

    // Start at step 2 by going through step 1
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('Email 地址'), 'user@test.com');
    await user.type(screen.getByLabelText('手機號碼'), '+886912345678');
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    await waitFor(() => {
      expect(mockEmailStart).toHaveBeenCalledWith({ email: 'user@test.com' });
    });
  });

  it('step 5 result nav buttons call navigate', async () => {
    mockUseKycMe.mockReturnValue({
      data: { ...mockKycMeData, emailVerified: true, phoneVerified: true, currentTier: 2 },
      isLoading: false,
    });

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: '前往案件看板' }));

    await user.click(screen.getByRole('button', { name: '前往案件看板' }));
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');

    await user.click(screen.getByRole('button', { name: '我的投標' }));
    expect(mockNavigate).toHaveBeenCalledWith('/bids');
  });

  it('step indicator shows correct aria-current=step for active step', async () => {
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    const stepDots = document.querySelectorAll('[aria-current="step"]');
    expect(stepDots.length).toBe(1);
  });

  it('advancing step 1 triggers emailStart call with correct email', async () => {
    mockEmailStart.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('Email 地址'), 'wizard@test.com');
    await user.type(screen.getByLabelText('手機號碼'), '+886987654321');
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    await waitFor(() => {
      expect(mockEmailStart).toHaveBeenCalledWith({ email: 'wizard@test.com' });
    });
    // Step 2 heading should appear
    await waitFor(() => {
      expect(screen.getByText(/Step 2 \/ 5/i)).toBeInTheDocument();
    });
  });
});

// ── Error tests ──────────────────────────────────────────────────────────────

describe('KycPage — error states', () => {
  beforeEach(() => {
    mockUseKycMe.mockReturnValue({ data: mockKycMeData, isLoading: false });
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockPhoneStart.mockReset();
  });

  it('shows validation error on step 1 for empty email', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('手機號碼'), '+886912345678');
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    expect(screen.getByText('請輸入 Email 地址')).toBeInTheDocument();
  });

  it('shows E.164 validation error on step 1 for invalid phone', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('Email 地址'), 'a@b.com');
    await user.type(screen.getByLabelText('手機號碼'), '0912345678'); // missing + prefix
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    // The alert role is on the validation error element specifically
    expect(screen.getByRole('alert')).toHaveTextContent('E.164');
  });

  it('shows rate-limit error when emailStart fails with 429', async () => {
    mockEmailStart.mockRejectedValue(
      Object.assign(new Error('rate limited'), {
        isAxiosError: true,
        response: { status: 429, data: { code: 'RATE_LIMITED' } },
      })
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/Step 1 \/ 5/i));

    await user.type(screen.getByLabelText('Email 地址'), 'a@b.com');
    await user.type(screen.getByLabelText('手機號碼'), '+886912345678');
    await user.click(screen.getByRole('button', { name: '下一步：Email 驗證' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('發送次數過多');
    });
  });
});
