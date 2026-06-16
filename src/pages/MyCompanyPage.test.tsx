/**
 * MyCompanyPage tests (Vitest + RTL).
 *
 * Cases:
 *   render:       cover/logo/name/meta + about (live) + team roster
 *   empty-state:  no about → 尚無公司簡介; no members → 尚無成員
 *   interaction:  open edit form, type, submit → useUpdateMyCompany fires (full-replace)
 *   error:        update HANDLE_TAKEN / VALIDATION_ERROR / NOT_COMPANY_OWNER inline
 *   not-found:    COMPANY_NOT_FOUND → 尚未綁定公司
 *   no-fake-data: design mock names/numbers (奇點科技 / 28 件 / 4.9 …) NOT rendered
 *
 * The company hooks are mocked (mirrors NetworkPage.test.tsx).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import MyCompanyPage from './MyCompanyPage';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useMyCompany, useCompanyMembers, useUpdateMyCompany } from '../lib/query';
import type { MyCompany, CompanyMember } from '../lib/api/coverones';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../lib/query', () => ({
  useMyCompany: vi.fn(),
  useCompanyMembers: vi.fn(),
  useUpdateMyCompany: vi.fn(),
}));

const mockUseMyCompany = vi.mocked(useMyCompany);
const mockUseCompanyMembers = vi.mocked(useCompanyMembers);
const mockUseUpdateMyCompany = vi.mocked(useUpdateMyCompany);

// ─── Fixtures ──────────────────────────────────────────────────────────────────
const mockUser: AuthUser = {
  id: 'me-0001',
  email: 'owner@example.com',
  displayName: 'Owner',
  avatarUrl: null,
  accountType: 'COMPANY',
  kycTier: 1,
  status: 'ACTIVE',
  emailVerified: true,
  companyId: 'co-1',
};

function makeCompany(over: Partial<MyCompany> = {}): MyCompany {
  return {
    id: 'co-1',
    handle: 'acme',
    name: 'Acme 工坊',
    tagline: '我們做真的東西',
    about: '一段真實的公司簡介。',
    location: '台北市',
    website: 'https://acme.example.com',
    industry: '軟體開發',
    companySize: '11–50 人',
    foundedYear: 2020,
    logoUrl: null,
    coverUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    registrationNo: '12345678',
    ...over,
  };
}

function makeMember(over: Partial<CompanyMember> = {}): CompanyMember {
  return {
    userId: 'u-1',
    displayName: '王小明',
    handle: 'ming',
    headline: '工程師',
    avatarUrl: null,
    isOwner: false,
    ...over,
  };
}

// query/mutation stubs (only the fields the page reads).
function queryStub<T>(
  data: T | undefined,
  opts: Partial<{ isLoading: boolean; isError: boolean; error: unknown }> = {},
) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
    error: opts.error ?? null,
  } as unknown as ReturnType<typeof useMyCompany>;
}

function mutationStub(over: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    ...over,
  } as unknown as ReturnType<typeof useUpdateMyCompany>;
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<MyCompanyPage />, { wrapper: makeWrapper() });
}

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: mockUser,
    isAuthenticated: true,
    isHydrating: false,
  });
  mockUseMyCompany.mockReturnValue(queryStub(makeCompany()));
  mockUseCompanyMembers.mockReturnValue(
    queryStub({ members: [] }) as unknown as ReturnType<typeof useCompanyMembers>,
  );
  mockUseUpdateMyCompany.mockReturnValue(mutationStub());
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('MyCompanyPage', () => {
  it('renders live company name, handle, meta and about', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Acme 工坊');
    expect(screen.getByText('@acme')).toBeInTheDocument();
    expect(screen.getByText('軟體開發')).toBeInTheDocument();
    expect(screen.getByText('台北市')).toBeInTheDocument();
    expect(screen.getByText('一段真實的公司簡介。')).toBeInTheDocument();
    // registrationNo is owner-only and shown in the meta strip.
    expect(screen.getByText(/統編 12345678/)).toBeInTheDocument();
  });

  it('renders team roster with displayName, handle and 負責人 badge for owner', () => {
    mockUseCompanyMembers.mockReturnValue(
      queryStub({
        members: [makeMember({ isOwner: true, displayName: '負責人甲' }), makeMember({ userId: 'u-2', displayName: '員工乙', handle: null })],
      }) as unknown as ReturnType<typeof useCompanyMembers>,
    );
    renderPage();
    expect(screen.getByText('負責人甲')).toBeInTheDocument();
    expect(screen.getByText('員工乙')).toBeInTheDocument();
    expect(screen.getByText('負責人')).toBeInTheDocument();
  });

  it('shows empty-states when about is null and there are no members', () => {
    mockUseMyCompany.mockReturnValue(queryStub(makeCompany({ about: null })));
    renderPage();
    expect(screen.getByText('尚無公司簡介')).toBeInTheDocument();
    expect(screen.getByText('尚無成員')).toBeInTheDocument();
  });

  it('opens the edit form, accepts input, and fires useUpdateMyCompany (full-replace) on submit', async () => {
    const updateMutate = vi.fn();
    mockUseUpdateMyCompany.mockReturnValue(mutationStub({ mutate: updateMutate }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '編輯公司資料' }));
    const nameInput = screen.getByLabelText('公司名稱');
    await user.clear(nameInput);
    await user.type(nameInput, 'Acme 改名');
    await user.click(screen.getByRole('button', { name: '儲存變更' }));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0];
    expect(payload.name).toBe('Acme 改名');
    // full-replace: every editable field is present in the payload.
    expect(payload).toHaveProperty('handle');
    expect(payload).toHaveProperty('tagline');
    expect(payload).toHaveProperty('about');
    expect(payload).toHaveProperty('foundedYear');
  });

  it('surfaces HANDLE_TAKEN inline when the update fails', async () => {
    const updateMutate = vi.fn(
      (_data: unknown, opts?: { onError?: (e: unknown) => void }) => {
        opts?.onError?.({ response: { data: { error: { code: 'HANDLE_TAKEN' } } } });
      },
    );
    mockUseUpdateMyCompany.mockReturnValue(mutationStub({ mutate: updateMutate }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '編輯公司資料' }));
    await user.click(screen.getByRole('button', { name: '儲存變更' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('此 handle 已被使用');
  });

  it('surfaces VALIDATION_ERROR inline when the update fails', async () => {
    const updateMutate = vi.fn(
      (_data: unknown, opts?: { onError?: (e: unknown) => void }) => {
        opts?.onError?.({ response: { data: { error: { code: 'VALIDATION_ERROR' } } } });
      },
    );
    mockUseUpdateMyCompany.mockReturnValue(mutationStub({ mutate: updateMutate }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '編輯公司資料' }));
    await user.click(screen.getByRole('button', { name: '儲存變更' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('欄位格式不正確');
  });

  it('surfaces NOT_COMPANY_OWNER inline when the update is rejected', async () => {
    const updateMutate = vi.fn(
      (_data: unknown, opts?: { onError?: (e: unknown) => void }) => {
        opts?.onError?.({ response: { data: { error: { code: 'NOT_COMPANY_OWNER' } } } });
      },
    );
    mockUseUpdateMyCompany.mockReturnValue(mutationStub({ mutate: updateMutate }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '編輯公司資料' }));
    await user.click(screen.getByRole('button', { name: '儲存變更' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('只有公司負責人');
  });

  it('renders a clear message when the account has no company (COMPANY_NOT_FOUND)', () => {
    mockUseMyCompany.mockReturnValue(
      queryStub<MyCompany>(undefined, {
        isError: true,
        error: { response: { data: { error: { code: 'COMPANY_NOT_FOUND' } } } },
      }),
    );
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('尚未綁定公司');
  });

  it('does NOT render any deferred/fabricated company names or numbers', () => {
    mockUseCompanyMembers.mockReturnValue(
      queryStub({ members: [makeMember()] }) as unknown as ReturnType<typeof useCompanyMembers>,
    );
    renderPage();
    // Fabricated mock data from Company.html that has no backing API.
    for (const fake of ['奇點科技', '玉山金控', '綠能精密', '蝦皮購物', 'Alex Chen', 'Maya Lin']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }
    // Fabricated stat-strip numbers / ratings / cert badges absent.
    expect(screen.queryByText(/4\.9/)).not.toBeInTheDocument();
    expect(screen.queryByText(/B\+ 級認證/)).not.toBeInTheDocument();
    expect(screen.queryByText(/過往 28 件零糾紛/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3,284/)).not.toBeInTheDocument();
  });
});
