import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';

// ── API mocks ────────────────────────────────────────────────────────────────

vi.mock('../lib/api/coverones', () => ({
  authApi: {
    me: vi.fn(),
    listIdentities: vi.fn(),
    bindIdentity: vi.fn(),
    unbindIdentity: vi.fn(),
  },
  kycApi: {
    getStatus: vi.fn(),
  },
}));

import { authApi, kycApi } from '../lib/api/coverones';
const mockAuthApi = vi.mocked(authApi);
const mockKycApi = vi.mocked(kycApi);

// ── Test helpers ─────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

const mockProfile = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: '測試公司',
  avatarUrl: null,
  accountType: 'COMPANY' as const,
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

const mockKycStatus = {
  currentTier: 2,
  kycType: 'COMPANY',
  submission: {
    id: 'kyc-1',
    accountType: 'COMPANY' as const,
    status: 'APPROVED' as const,
    tierGranted: 2,
    submittedAt: '2026-01-01T00:00:00Z',
    reviewedAt: '2026-01-02T00:00:00Z',
  },
};

const mockIdentities = {
  identities: [
    { provider: 'google' as const, email: 'test@gmail.com', linkedAt: '2026-01-01T00:00:00Z' },
  ],
  hasPassword: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthApi.me.mockResolvedValue(mockProfile);
  mockKycApi.getStatus.mockResolvedValue(mockKycStatus);
  mockAuthApi.listIdentities.mockResolvedValue(mockIdentities);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Settings — render', () => {
  it('renders the page title', () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
  });

  it('renders desktop sidebar nav with all sections', () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    const nav = screen.getByRole('complementary', { name: '設定導覽' });
    expect(nav).toBeInTheDocument();
    // nav items: in sidebar, all section labels present
    expect(nav).toHaveTextContent('公司資訊');
    expect(nav).toHaveTextContent('認證與資格');
    expect(nav).toHaveTextContent('API 金鑰');
    expect(nav).toHaveTextContent('通知偏好');
  });

  it('renders profile data from real API when loaded', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    // Both desktop and mobile sections render (CSS hides one at runtime; jsdom shows both)
    await waitFor(() => {
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('公司帳號').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('測試公司').length).toBeGreaterThanOrEqual(1);
  });

  it('shows KYC done status from real API (verification section)', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    // Navigate to verification section in desktop nav
    const verificationBtn = screen.getByRole('menuitem', { name: '認證與資格' });
    fireEvent.click(verificationBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/已完成/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Settings — section nav', () => {
  it('shows 公司資訊 content by default', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    // Default section is 公司資訊 — profile fields loaded (desktop + mobile both render)
    await waitFor(() => {
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('company nav item has aria-current=page by default', () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    const companyBtn = screen.getByRole('menuitem', { name: '公司資訊' });
    expect(companyBtn).toHaveAttribute('aria-current', 'page');
  });

  it('switches active nav item when another is clicked', () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    const apiBtn = screen.getByRole('menuitem', { name: 'API 金鑰' });
    fireEvent.click(apiBtn);
    expect(apiBtn).toHaveAttribute('aria-current', 'page');
    // company should no longer be active
    const companyBtn = screen.getByRole('menuitem', { name: '公司資訊' });
    expect(companyBtn).not.toHaveAttribute('aria-current', 'page');
  });

  it('switches to 認證與資格 section on nav click', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    const verificationBtn = screen.getByRole('menuitem', { name: '認證與資格' });
    fireEvent.click(verificationBtn);
    await waitFor(() => {
      // OAuth identities section label rendered (may appear in desktop + mobile)
      expect(screen.getAllByText('社群帳號綁定').length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Settings — empty states (sections without backing API)', () => {
  it('shows Coming soon for 團隊成員 section', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '團隊成員' }));
    await waitFor(() => {
      expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Coming soon for 方案與付款 section', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '方案與付款' }));
    await waitFor(() => {
      expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Coming soon for API 金鑰 section', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: 'API 金鑰' }));
    await waitFor(() => {
      expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Coming soon for 通知偏好 section', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '通知偏好' }));
    await waitFor(() => {
      expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Settings — error states', () => {
  it('shows profile load error message when API fails', async () => {
    mockAuthApi.me.mockRejectedValue(new Error('Network error'));
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/無法載入公司資訊/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows identities error in verification section when API fails', async () => {
    mockAuthApi.listIdentities.mockRejectedValue(new Error('Network error'));
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '認證與資格' }));
    await waitFor(() => {
      expect(screen.getAllByText(/無法載入登入方式/).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Settings — OAuth unbind interaction', () => {
  it('shows unbind button for bound Google provider', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '認證與資格' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '解除綁定 Google' }).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows bind button for unbound LINE provider', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('menuitem', { name: '認證與資格' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '綁定 LINE' }).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Settings — avatarSettings flag', () => {
  it('renders avatar element when avatarSettings flag is enabled', async () => {
    const Wrapper = createWrapper();
    render(<Settings />, { wrapper: Wrapper });
    await waitFor(() => {
      // avatarSettings=true shows company avatar with initials (desktop + mobile = multiple)
      expect(screen.getAllByLabelText('公司頭像').length).toBeGreaterThanOrEqual(1);
    });
  });
});
