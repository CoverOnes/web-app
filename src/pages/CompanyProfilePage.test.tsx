/**
 * CompanyProfilePage tests (Vitest + RTL).
 *
 * Cases:
 *   render:       cover/logo/name/tagline/meta/website/about (live)
 *   members:      team grid renders displayName + 負責人 badge for owner
 *   not-found:    COMPANY_NOT_FOUND → 找不到此公司
 *   radar:        capability radar renders the 尚無能力資料 empty-state shell
 *   disabled:     follow / message actions are disabled (尚未開放)
 *   no-fake-data: design mock names/numbers (台積電子 / 12,400 / 4.9 …) NOT rendered
 *
 * The company hooks are mocked; :companyId resolves via a Route.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import CompanyProfilePage from './CompanyProfilePage';
import { usePublicCompany, useCompanyMembers } from '../lib/query';
import type { CompanyProfile, CompanyMember } from '../lib/api/coverones';

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../lib/query', () => ({
  usePublicCompany: vi.fn(),
  useCompanyMembers: vi.fn(),
}));

const mockUsePublicCompany = vi.mocked(usePublicCompany);
const mockUseCompanyMembers = vi.mocked(useCompanyMembers);

// ─── Fixtures ──────────────────────────────────────────────────────────────────
function makeCompany(over: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    id: 'co-9',
    handle: 'realco',
    name: '真實股份有限公司',
    tagline: '可被驗證的標語',
    about: '一段真實的公開公司簡介。',
    location: '新北市',
    website: 'https://realco.example.com',
    industry: '製造業',
    companySize: '51–200 人',
    foundedYear: 2015,
    logoUrl: null,
    coverUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function makeMember(over: Partial<CompanyMember> = {}): CompanyMember {
  return {
    userId: 'u-1',
    displayName: '陳採購',
    handle: 'chen',
    headline: '採購窗口',
    avatarUrl: null,
    isOwner: false,
    ...over,
  };
}

function queryStub<T>(
  data: T | undefined,
  opts: Partial<{ isLoading: boolean; isError: boolean; error: unknown }> = {},
) {
  return {
    data,
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
    error: opts.error ?? null,
  } as unknown as ReturnType<typeof usePublicCompany>;
}

function renderPage(companyId = 'co-9') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/companies/${companyId}`]}>
        <Routes>
          <Route path="/companies/:companyId" element={<CompanyProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockUsePublicCompany.mockReturnValue(queryStub(makeCompany()));
  mockUseCompanyMembers.mockReturnValue(
    queryStub({ members: [] }) as unknown as ReturnType<typeof useCompanyMembers>,
  );
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('CompanyProfilePage', () => {
  it('renders live company name, tagline, meta and about', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('真實股份有限公司');
    expect(screen.getByText('@realco')).toBeInTheDocument();
    expect(screen.getByText('可被驗證的標語')).toBeInTheDocument();
    expect(screen.getByText('製造業')).toBeInTheDocument();
    expect(screen.getByText('新北市')).toBeInTheDocument();
    expect(screen.getByText('一段真實的公開公司簡介。')).toBeInTheDocument();
  });

  it('renders the website as an https link to the live url', () => {
    renderPage();
    const link = screen.getByRole('link', { name: 'realco.example.com' });
    expect(link).toHaveAttribute('href', 'https://realco.example.com');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders team members with 負責人 badge for the owner', () => {
    mockUseCompanyMembers.mockReturnValue(
      queryStub({
        members: [makeMember({ isOwner: true, displayName: '李負責' }), makeMember({ userId: 'u-2', displayName: '林窗口' })],
      }) as unknown as ReturnType<typeof useCompanyMembers>,
    );
    renderPage();
    expect(screen.getByText('李負責')).toBeInTheDocument();
    expect(screen.getByText('林窗口')).toBeInTheDocument();
    expect(screen.getByText('負責人')).toBeInTheDocument();
  });

  it('renders the capability radar empty-state shell (no fabricated 案數)', () => {
    renderPage();
    // Overlay label communicates the deferred state.
    expect(screen.getByText('尚無能力資料')).toBeInTheDocument();
    // The radar is an accessible img labelled as having no data.
    expect(screen.getByRole('img', { name: /能力地圖：尚無能力資料/ })).toBeInTheDocument();
  });

  it('renders follow / message actions as disabled (尚未開放)', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /追蹤公司（尚未開放）/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /私訊洽談（尚未開放）/ })).toBeDisabled();
  });

  it('shows 找不到此公司 on COMPANY_NOT_FOUND', () => {
    mockUsePublicCompany.mockReturnValue(
      queryStub<CompanyProfile>(undefined, {
        isError: true,
        error: { response: { data: { error: { code: 'COMPANY_NOT_FOUND' } } } },
      }),
    );
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('找不到此公司');
  });

  it('shows empty-state when about is null', () => {
    mockUsePublicCompany.mockReturnValue(queryStub(makeCompany({ about: null })));
    renderPage();
    expect(screen.getByText('尚無公司簡介')).toBeInTheDocument();
  });

  it('does NOT render any deferred/fabricated company names or numbers', () => {
    mockUseCompanyMembers.mockReturnValue(
      queryStub({ members: [makeMember()] }) as unknown as ReturnType<typeof useCompanyMembers>,
    );
    renderPage();
    // Fabricated mock data from CompanyProfile.html that has no backing API.
    for (const fake of ['台積電子', '鴻海精密', '聯發科技', '日月光投控', '奇點科技', '沛星互動']) {
      expect(screen.queryByText(new RegExp(fake))).not.toBeInTheDocument();
    }
    // Fabricated stat-strip numbers / ratings / cert badges / 案數 absent.
    expect(screen.queryByText(/12,400/)).not.toBeInTheDocument();
    expect(screen.queryByText(/248,920/)).not.toBeInTheDocument();
    expect(screen.queryByText(/4\.9/)).not.toBeInTheDocument();
    expect(screen.queryByText(/42 案/)).not.toBeInTheDocument();
    expect(screen.queryByText(/官方認證/)).not.toBeInTheDocument();
  });
});
