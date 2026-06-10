import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PostJobPage from './PostJobPage';
import { sumMilestoneAmounts } from '../utils/budgetUtils';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useCreateListing } from '../lib/query';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../lib/query', () => ({
  useCreateListing: vi.fn(),
}));

// react-router useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseCreateListing = vi.mocked(useCreateListing);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tier2User: AuthUser = {
  id: 'u1',
  email: 'vendor@example.com',
  displayName: 'Tier2 User',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

const tier1User: AuthUser = {
  ...tier2User,
  id: 'u2',
  kycTier: 1,
};

function pendingMutation() {
  return {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateListing>;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PostJobPage />
    </MemoryRouter>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// ─── sumMilestoneAmounts unit tests ──────────────────────────────────────────
// Regression guard for audit finding: JS float summation produced artifacts
// (0.1 + 0.2 → '0.30000000000000004') in budget strings sent to the backend.

describe('sumMilestoneAmounts', () => {
  it('returns 0 for an empty milestone list', () => {
    expect(sumMilestoneAmounts([])).toBe(0);
  });

  it('returns 0 for milestones with no amount entered', () => {
    expect(sumMilestoneAmounts([{ amount: '' }, { amount: '' }])).toBe(0);
  });

  it('sums integer amounts without precision loss', () => {
    expect(sumMilestoneAmounts([{ amount: '100000' }, { amount: '50000' }])).toBe(150000);
  });

  it('avoids JS float artifact: 0.1 + 0.2 === 0.3 (not 0.30000000000000004)', () => {
    const result = sumMilestoneAmounts([{ amount: '0.1' }, { amount: '0.2' }]);
    expect(result).toBe(0.3);
    // Explicitly assert the naive float sum would fail
    expect(0.1 + 0.2).not.toBe(0.3); // documents the bug that was fixed
  });

  it('strips currency formatting characters (commas, dollar signs)', () => {
    expect(sumMilestoneAmounts([{ amount: '$1,200.50' }, { amount: 'NT$800.50' }])).toBe(2001);
  });

  it('ignores non-finite values (NaN, Infinity) without throwing', () => {
    expect(sumMilestoneAmounts([{ amount: 'abc' }, { amount: '500' }])).toBe(500);
  });

  it('skips negative amounts (does not add them to the sum)', () => {
    // Negative milestones make no financial sense; '-100' is skipped, not
    // converted to +100 by the non-numeric strip, so the result is 500 not 600.
    expect(sumMilestoneAmounts([{ amount: '-100' }, { amount: '500' }])).toBe(500);
  });

  it('handles large real-world budget sums (NT$ 4.5M)', () => {
    expect(
      sumMilestoneAmounts([
        { amount: '1500000' },
        { amount: '1500000' },
        { amount: '1500000' },
      ])
    ).toBe(4500000);
  });
});

describe('PostJobPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateListing.mockReturnValue(pendingMutation());
  });

  // ── Test 1: TierGuard gates users with kycTier < 2 ───────────────────────

  describe('TierGuard', () => {
    it('shows the tier guard instead of the form for a user with kycTier < 2', () => {
      useAuthStore.setState({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: tier1User,
        isAuthenticated: true,
        isHydrating: false,
      });

      renderPage();

      // TierGuard full-page shows KYC CTA, not the form
      expect(screen.getByRole('button', { name: '完成 KYC 認證' })).toBeInTheDocument();
      // The step 1 form content should NOT be present
      expect(screen.queryByText('選擇專案類別')).not.toBeInTheDocument();
    });
  });

  // ── Tests for tier-2 users ────────────────────────────────────────────────

  describe('Step 1 — 基本資訊', () => {
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: tier2User,
        isAuthenticated: true,
        isHydrating: false,
      });
    });

    it('renders Step 1 with category grid and title/description fields', () => {
      renderPage();

      expect(screen.getByText('選擇專案類別')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例：API Gateway 微服務化重構')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('詳述案件背景、技術需求、驗收標準...')).toBeInTheDocument();
    });

    it('advances to Step 2 when required fields are filled and 下一步 is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      // Select a category
      const devCategory = screen.getByRole('radio', { name: /技術接案/ });
      await user.click(devCategory);

      // Fill title
      const titleInput = screen.getByPlaceholderText('例：API Gateway 微服務化重構');
      await user.type(titleInput, 'API Gateway 重構專案');

      // Fill description
      const descInput = screen.getByPlaceholderText('詳述案件背景、技術需求、驗收標準...');
      await user.type(descInput, '這是一個微服務重構的需求，需要熟悉 Go 語言並有大型系統改造實戰經驗。');

      // Click 下一步
      const nextBtn = screen.getByRole('button', { name: '下一步' });
      await user.click(nextBtn);

      // Should now be on Step 2
      await waitFor(() => {
        expect(screen.getByText('合約與保密')).toBeInTheDocument();
      });
    });

    it('blocks 下一步 and shows inline error when required fields (category/title/description) are empty', async () => {
      const user = userEvent.setup();
      renderPage();

      // Do NOT fill any fields
      const nextBtn = screen.getByRole('button', { name: '下一步' });
      await user.click(nextBtn);

      // Should show inline error alert, not advance to step 2
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Still on Step 1
      expect(screen.getByText('選擇專案類別')).toBeInTheDocument();
      expect(screen.queryByText('合約與保密')).not.toBeInTheDocument();
    });

    it('shows inline error for missing title even when category is selected', async () => {
      const user = userEvent.setup();
      renderPage();

      // Select category but leave title empty
      const devCategory = screen.getByRole('radio', { name: /技術接案/ });
      await user.click(devCategory);

      const nextBtn = screen.getByRole('button', { name: '下一步' });
      await user.click(nextBtn);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('請填寫專案標題');
      });
    });
  });

  // ── Test 3: Step 4 submit calls mutation + navigates on success ──────────

  describe('Step 4 — 審核與發布', () => {
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: tier2User,
        isAuthenticated: true,
        isHydrating: false,
      });
    });

    it('calls createListing mutation with correct payload and navigates on success', async () => {
      const user = userEvent.setup();
      const mutateAsync = vi.fn().mockResolvedValue({ id: 'listing-abc-123' });
      mockUseCreateListing.mockReturnValue({
        mutateAsync,
        isPending: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useCreateListing>);

      renderPage();

      // --- Step 1 ---
      const devCategory = screen.getByRole('radio', { name: /技術接案/ });
      await user.click(devCategory);

      const titleInput = screen.getByPlaceholderText('例：API Gateway 微服務化重構');
      await user.type(titleInput, '測試標題');

      const descInput = screen.getByPlaceholderText('詳述案件背景、技術需求、驗收標準...');
      await user.type(descInput, '測試描述內容，足夠長度的描述文字。');

      await user.click(screen.getByRole('button', { name: '下一步' }));
      await waitFor(() => expect(screen.getByText('合約與保密')).toBeInTheDocument());

      // --- Step 2 ---
      await user.click(screen.getByRole('button', { name: '下一步' }));
      await waitFor(() => expect(screen.getByText('里程碑與付款')).toBeInTheDocument());

      // --- Step 3 ---
      await user.click(screen.getByRole('button', { name: '下一步' }));
      // Step 4: the submit button becomes visible (stepper text "審核與發布" is duplicated in stepper+heading)
      await waitFor(() => expect(screen.getByRole('button', { name: '發布需求' })).toBeInTheDocument());

      // --- Step 4 — submit ---
      const submitBtn = screen.getByRole('button', { name: '發布需求' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledTimes(1);
        const payload = mutateAsync.mock.calls[0][0] as Record<string, unknown>;
        expect(payload).toMatchObject({
          title: '測試標題',
          currency: 'TWD',
        });
        // budgetMax should be undefined (no explicit upper bound)
        expect(payload.budgetMax).toBeUndefined();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/jobs/listing-abc-123', { replace: true });
      });
    });
  });
});
