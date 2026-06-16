import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import type { OwnProfile, PublicProfile } from '../lib/api/coverones';

// ── API mocks ────────────────────────────────────────────────────────────────

vi.mock('../lib/api/coverones', () => ({
  authApi: {
    getMyProfile: vi.fn(),
    getPublicProfile: vi.fn(),
    updateMyProfile: vi.fn(),
  },
}));

// ── authStore mock ───────────────────────────────────────────────────────────
// useAuthStore is a Zustand selector hook: the component calls
// useAuthStore((s) => s.user). Mock it as a selector-aware fn so it returns the
// `user` slice of a controllable mock state.

let mockUser: { id: string } | null = { id: 'me-1' };
vi.mock('../store/authStore', () => ({
  useAuthStore: <T,>(selector: (s: { user: { id: string } | null }) => T): T =>
    selector({ user: mockUser }),
}));

// http helper: real getApiErrorCode reads error.code; mirror that minimally so
// tests can drive 404 / HANDLE_TAKEN branches via thrown { code } objects.
vi.mock('../lib/api/http', () => ({
  getApiErrorCode: (error: unknown): string | undefined =>
    error && typeof error === 'object' && 'code' in error
      ? (error as { code?: string }).code
      : undefined,
}));

import { authApi } from '../lib/api/coverones';
const mockAuthApi = vi.mocked(authApi);

// ── Test helpers ─────────────────────────────────────────────────────────────

function renderProfile(initialPath: string) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fullProfile: OwnProfile = {
  id: 'me-1',
  handle: 'wayne',
  displayName: '王小明',
  headline: '全端工程師',
  bio: '我喜歡寫程式。',
  location: '台北',
  avatarUrl: null,
  coverUrl: null,
  accountType: 'PERSONAL',
  verified: true,
  kycTier: 2,
  joinedAt: '2025-03-15T00:00:00Z',
};

const emptyProfile: PublicProfile = {
  id: 'other-9',
  handle: null,
  displayName: '匿名使用者',
  headline: null,
  bio: null,
  location: null,
  avatarUrl: null,
  coverUrl: null,
  accountType: 'PERSONAL',
  verified: false,
  kycTier: 0,
  joinedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: 'me-1' };
});

// ── 1. Own mode ──────────────────────────────────────────────────────────────

describe('ProfilePage — own mode (/profile)', () => {
  it('calls getMyProfile, shows the edit button and live fields', async () => {
    mockAuthApi.getMyProfile.mockResolvedValue(fullProfile);
    renderProfile('/profile');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('王小明');
    });

    expect(mockAuthApi.getMyProfile).toHaveBeenCalledTimes(1);
    // own mode never fetches the public endpoint
    expect(mockAuthApi.getPublicProfile).not.toHaveBeenCalled();

    // edit button present (own mode)
    expect(screen.getByRole('button', { name: /編輯個人檔案/ })).toBeInTheDocument();

    // live fields rendered
    expect(screen.getByText('@wayne')).toBeInTheDocument();
    expect(screen.getByText('全端工程師')).toBeInTheDocument();
    expect(screen.getByText('我喜歡寫程式。')).toBeInTheDocument();
    expect(screen.getByText(/台北/)).toBeInTheDocument();
    // joinedAt → YYYY / MM
    expect(screen.getByText('2025 / 03')).toBeInTheDocument();
  });
});

// ── 2. Other mode ────────────────────────────────────────────────────────────

describe('ProfilePage — other mode (/profile/:userId ≠ me)', () => {
  it('calls getPublicProfile, hides edit button, disables action buttons', async () => {
    mockAuthApi.getPublicProfile.mockResolvedValue({
      ...fullProfile,
      id: 'other-9',
      displayName: '他人',
    });
    renderProfile('/profile/other-9');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('他人');
    });

    expect(mockAuthApi.getPublicProfile).toHaveBeenCalledWith('other-9');
    // other mode MUST NOT fetch own data
    expect(mockAuthApi.getMyProfile).not.toHaveBeenCalled();

    // no edit button in other mode
    expect(screen.queryByRole('button', { name: /編輯個人檔案/ })).not.toBeInTheDocument();

    // action buttons present but disabled
    const message = screen.getByRole('button', { name: /發送訊息/ });
    const meeting = screen.getByRole('button', { name: /安排會議/ });
    const connect = screen.getByRole('button', { name: /加入人脈/ });
    expect(message).toBeDisabled();
    expect(meeting).toBeDisabled();
    expect(connect).toBeDisabled();
  });
});

// ── 3. Loading ───────────────────────────────────────────────────────────────

describe('ProfilePage — loading', () => {
  it('renders a status skeleton while the query is pending', () => {
    // never resolves → stays in loading
    mockAuthApi.getMyProfile.mockReturnValue(new Promise(() => {}));
    renderProfile('/profile');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ── 4. Empty-state ───────────────────────────────────────────────────────────

describe('ProfilePage — empty-state (null fields + deferred sections)', () => {
  it('renders "尚無資料" for deferred sections and shows no fabricated content', async () => {
    mockAuthApi.getPublicProfile.mockResolvedValue(emptyProfile);
    renderProfile('/profile/other-9');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('匿名使用者');
    });

    // deferred sections render the empty-state copy
    expect(screen.getAllByText('尚無資料').length).toBeGreaterThanOrEqual(1);
    // null bio → 尚無自我介紹
    expect(screen.getByText('尚無自我介紹')).toBeInTheDocument();

    // null headline / location / handle → those lines absent
    expect(screen.queryByText('全端工程師')).not.toBeInTheDocument();
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^@/)).not.toBeInTheDocument();

    // ZERO fake data — sample names + currency MUST be absent
    expect(screen.queryByText(/張育騰/)).not.toBeInTheDocument();
    expect(screen.queryByText(/奇點科技/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NT\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,840/)).not.toBeInTheDocument();
  });
});

// ── 5. Error ─────────────────────────────────────────────────────────────────

describe('ProfilePage — error states', () => {
  it('shows a generic alert when the query rejects', async () => {
    mockAuthApi.getMyProfile.mockRejectedValue(new Error('boom'));
    renderProfile('/profile');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('無法載入個人檔案，請重新整理');
  });

  it('shows "找不到此使用者" on a 404 in other mode', async () => {
    mockAuthApi.getPublicProfile.mockRejectedValue({ code: 'USER_NOT_FOUND' });
    renderProfile('/profile/missing-1');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('找不到此使用者');
  });
});

// ── 6. Own edit ──────────────────────────────────────────────────────────────

describe('ProfilePage — own edit', () => {
  it('submits the full editable set to updateMyProfile', async () => {
    mockAuthApi.getMyProfile.mockResolvedValue(fullProfile);
    mockAuthApi.updateMyProfile.mockResolvedValue(fullProfile);
    renderProfile('/profile');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /編輯個人檔案/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /編輯個人檔案/ }));

    // edit form opened
    const form = await screen.findByRole('form', { name: '編輯個人檔案表單' });
    expect(form).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }));

    await waitFor(() => {
      expect(mockAuthApi.updateMyProfile).toHaveBeenCalledTimes(1);
    });
    expect(mockAuthApi.updateMyProfile).toHaveBeenCalledWith({
      displayName: '王小明',
      handle: 'wayne',
      headline: '全端工程師',
      bio: '我喜歡寫程式。',
      location: '台北',
      avatarUrl: null,
      coverUrl: null,
    });
  });

  it('shows the conflict message when the API returns HANDLE_TAKEN', async () => {
    mockAuthApi.getMyProfile.mockResolvedValue(fullProfile);
    mockAuthApi.updateMyProfile.mockRejectedValue({ code: 'HANDLE_TAKEN' });
    renderProfile('/profile');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /編輯個人檔案/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /編輯個人檔案/ }));
    await screen.findByRole('form', { name: '編輯個人檔案表單' });
    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }));

    await waitFor(() => {
      expect(screen.getByText(/此 handle 已被使用/)).toBeInTheDocument();
    });
  });
});
