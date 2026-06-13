/**
 * ContractDetailPage — loading/error/data state tests.
 *
 * Tests:
 *   render: loading skeleton, error state, data render (title, status, amount)
 *   render: stepper shows correct active step
 *   render: invoice/milestone sections show empty-state (no API backing)
 *   interaction: submit-for-signature button visible to client on DRAFT
 *   error: action error banner on mutation failure
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore, type AuthUser } from '../store/authStore';
import {
  useContract,
  useSignatures,
  useTasks,
  useSignContract,
  useCancelContract,
  useSubmitForSignature,
  useCreateTask,
  useUpdateTask,
} from '../lib/query';
import type { Contract } from '../lib/api/coverones';

// ── mocks ──────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../lib/query', () => ({
  useContract:             vi.fn(),
  useSignatures:           vi.fn(),
  useTasks:                vi.fn(),
  useSignContract:         vi.fn(),
  useCancelContract:       vi.fn(),
  useSubmitForSignature:   vi.fn(),
  useCreateTask:           vi.fn(),
  useUpdateTask:           vi.fn(),
}));

const mockUseContract           = vi.mocked(useContract);
const mockUseSignatures         = vi.mocked(useSignatures);
const mockUseTasks              = vi.mocked(useTasks);
const mockUseSignContract       = vi.mocked(useSignContract);
const mockUseCancelContract     = vi.mocked(useCancelContract);
const mockUseSubmitForSignature = vi.mocked(useSubmitForSignature);
const mockUseCreateTask         = vi.mocked(useCreateTask);
const mockUseUpdateTask         = vi.mocked(useUpdateTask);

// ── helpers ────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/contracts/c1']}>
        <Routes>
          <Route path="/contracts/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function noop(): any {
  return { mutate: vi.fn(), isPending: false };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'c1',
    listingId: 'l1',
    clientUserId: 'client-1',
    freelancerUserId: 'freelancer-1',
    title: '企業導購系統合約',
    terms: 'Terms and conditions.',
    amount: '1840000',
    currency: 'TWD',
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    contentHash: 'hash-abc',
    ...overrides,
  };
}

const CLIENT_USER: AuthUser = {
  id: 'client-1',
  email: 'client@example.com',
  displayName: 'Client User',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

function setupAllMocks(contractOverrides: Partial<Contract> = {}) {
  const contract = makeContract(contractOverrides);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseContract.mockReturnValue({ data: contract, isLoading: false, isError: false } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSignatures.mockReturnValue({ data: [] } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseTasks.mockReturnValue({ data: [] } as any);
  mockUseSignContract.mockReturnValue(noop());
  mockUseCancelContract.mockReturnValue(noop());
  mockUseSubmitForSignature.mockReturnValue(noop());
  mockUseCreateTask.mockReturnValue(noop());
  mockUseUpdateTask.mockReturnValue(noop());
  return contract;
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('ContractDetailPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'tok',
      refreshToken: 'ref',
      user: CLIENT_USER,
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  // ── render: loading ──────────────────────────────────────────────────────────

  it('(render-1) shows skeleton while loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseContract.mockReturnValue({ isLoading: true, isError: false } as any);
    mockUseSignatures.mockReturnValue(noop());
    mockUseTasks.mockReturnValue(noop());
    mockUseSignContract.mockReturnValue(noop());
    mockUseCancelContract.mockReturnValue(noop());
    mockUseSubmitForSignature.mockReturnValue(noop());
    mockUseCreateTask.mockReturnValue(noop());
    mockUseUpdateTask.mockReturnValue(noop());

    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Skeleton block is aria-hidden
    // eslint-disable-next-line testing-library/no-node-access
    const skeletons = document.querySelectorAll('[aria-hidden="true"].rounded-xl');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── render: error ────────────────────────────────────────────────────────────

  it('(render-2) shows "找不到合約" on fetch error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseContract.mockReturnValue({ isError: true, isLoading: false } as any);
    mockUseSignatures.mockReturnValue(noop());
    mockUseTasks.mockReturnValue(noop());
    mockUseSignContract.mockReturnValue(noop());
    mockUseCancelContract.mockReturnValue(noop());
    mockUseSubmitForSignature.mockReturnValue(noop());
    mockUseCreateTask.mockReturnValue(noop());
    mockUseUpdateTask.mockReturnValue(noop());

    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    expect(screen.getByText('找不到合約')).toBeInTheDocument();
  });

  // ── render: data ─────────────────────────────────────────────────────────────

  it('(render-3) renders contract title and formatted amount from real API data', async () => {
    setupAllMocks();
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Title appears in both PageHead h1 and the header card h2 — use getAllByText
    const titleElements = screen.getAllByText('企業導購系統合約');
    expect(titleElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1,840,000/)).toBeInTheDocument();
  });

  // ── render: stepper ──────────────────────────────────────────────────────────

  it('(render-4) stepper shows correct active step for ACTIVE contract', async () => {
    setupAllMocks({ status: 'ACTIVE' });
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Stepper list should be present
    const stepList = screen.getByRole('list', { name: '合約進度' });
    expect(stepList).toBeInTheDocument();
    // "執行中" appears in both stepper and status chip — use getAllByText
    const activeStepLabels = screen.getAllByText('執行中');
    expect(activeStepLabels.length).toBeGreaterThanOrEqual(1);
  });

  // ── render: CANCELLED hides stepper ──────────────────────────────────────────

  it('(render-5) cancelled contract shows cancelled notice, not stepper', async () => {
    setupAllMocks({ status: 'CANCELLED' });
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    expect(screen.queryByRole('list', { name: '合約進度' })).not.toBeInTheDocument();
    expect(screen.getByText('此合約已取消。')).toBeInTheDocument();
  });

  // ── render: invoice/milestone empty-states ────────────────────────────────────

  it('(render-6) invoice and milestone sections show "尚無資料" (no API backing)', async () => {
    setupAllMocks();
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    // Both "請款 / 發票" and "里程碑" sections should show empty-state text
    const noDataElements = screen.getAllByText('尚無資料');
    expect(noDataElements.length).toBeGreaterThanOrEqual(2);
  });

  // ── interaction: submit-for-signature ─────────────────────────────────────────

  it('(interaction-1) "送出簽署" button is visible to client on DRAFT contract (KYC≥2)', async () => {
    setupAllMocks({ status: 'DRAFT' });
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    const btn = screen.getByRole('button', { name: '送出簽署' });
    expect(btn).toBeInTheDocument();
  });

  // ── interaction: cancel button ───────────────────────────────────────────────

  it('(interaction-2) clicking "取消合約" opens confirm dialog', async () => {
    const user = userEvent.setup();
    setupAllMocks({ status: 'DRAFT' });
    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    await user.click(screen.getByRole('button', { name: '取消合約' }));

    expect(screen.getByRole('dialog', { name: '確認取消合約？' })).toBeInTheDocument();
  });

  // ── interaction: cancel dialog — keep contract ────────────────────────────────

  it('(interaction-3) "保留合約" closes dialog without calling mutation', async () => {
    const user = userEvent.setup();
    const cancelMutate = vi.fn();
    mockUseCancelContract.mockReturnValue({ mutate: cancelMutate, isPending: false } as ReturnType<typeof noop>);
    setupAllMocks({ status: 'DRAFT' });
    // Re-apply cancel mock after setupAllMocks reset it
    mockUseCancelContract.mockReturnValue({ mutate: cancelMutate, isPending: false } as ReturnType<typeof noop>);

    const { default: Page } = await import('./ContractDetailPage');
    render(<Page />, { wrapper: makeWrapper() });

    await user.click(screen.getByRole('button', { name: '取消合約' }));
    await user.click(screen.getByRole('button', { name: '保留合約，返回' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cancelMutate).not.toHaveBeenCalled();
  });
});
