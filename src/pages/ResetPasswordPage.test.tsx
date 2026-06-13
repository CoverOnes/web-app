/**
 * ResetPasswordPage.test.tsx
 *
 * Covers:
 *   render: no-token phase, form phase with valid token
 *   token-parse: ?token= absent → no-token; present → form
 *   validation: min-12-char client error, mismatch error
 *   interaction: successful reset navigates to /login with resetSuccess:true
 *   error states: INVALID_RESET_TOKEN, WEAK_PASSWORD, generic error
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResetPasswordPage from './ResetPasswordPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the query hook
const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock('../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/query')>();
  return {
    ...actual,
    useResetPassword: () => ({
      mutateAsync: mockMutateAsync,
      isPending: mockIsPending,
    }),
  };
});

function createWrapper(search = '') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/reset-password${search}`]}>
        <Routes>
          <Route path="/reset-password" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage(search = '') {
  return render(<ResetPasswordPage />, { wrapper: createWrapper(search) });
}

describe('ResetPasswordPage — token-parse / no-token phase', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockIsPending = false;
  });

  it('shows "缺少重設連結" when no ?token= is present', () => {
    renderPage('');
    expect(screen.getByRole('heading', { name: '缺少重設連結' })).toBeInTheDocument();
  });

  it('shows role=alert with instruction text in no-token phase', () => {
    renderPage('');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows "重新申請重設連結" link in no-token phase', () => {
    renderPage('');
    expect(screen.getByRole('link', { name: '重新申請重設連結' })).toBeInTheDocument();
  });

  it('shows the form when a ?token= is present', () => {
    renderPage('?token=abc123');
    expect(screen.getByRole('heading', { name: '設定新密碼' })).toBeInTheDocument();
  });
});

describe('ResetPasswordPage — render (with token)', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockIsPending = false;
  });

  it('renders new-password field', () => {
    renderPage('?token=abc123');
    expect(screen.getByLabelText('新密碼')).toBeInTheDocument();
  });

  it('renders confirm-password field', () => {
    renderPage('?token=abc123');
    expect(screen.getByLabelText('確認新密碼')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage('?token=abc123');
    expect(screen.getByRole('button', { name: '確認重設密碼' })).toBeInTheDocument();
  });

  it('password inputs have type=password', () => {
    renderPage('?token=abc123');
    const inputs = screen.getAllByLabelText(/密碼/);
    const passwordInputs = inputs.filter(
      (el) => (el as HTMLInputElement).type === 'password',
    );
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('password inputs have autoComplete=new-password', () => {
    renderPage('?token=abc123');
    // There's a show/hide toggle button, we want the actual inputs
    const newInput = screen.getByLabelText('新密碼') as HTMLInputElement;
    const confirmInput = screen.getByLabelText('確認新密碼') as HTMLInputElement;
    expect(newInput.autocomplete).toBe('new-password');
    expect(confirmInput.autocomplete).toBe('new-password');
  });
});

describe('ResetPasswordPage — client-side validation', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockIsPending = false;
  });

  it('shows error when password is shorter than 12 chars', async () => {
    const user = userEvent.setup();
    renderPage('?token=abc123');

    await user.type(screen.getByLabelText('新密碼'), 'short1');
    await user.type(screen.getByLabelText('確認新密碼'), 'short1');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('密碼至少 12 個字元');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage('?token=abc123');

    await user.type(screen.getByLabelText('新密碼'), 'strongpassword123');
    await user.type(screen.getByLabelText('確認新密碼'), 'differentpassword123');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('兩次輸入的密碼不一致');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordPage — interaction / success', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockIsPending = false;
  });

  it('calls mutateAsync with token + newPassword and navigates on success', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ reset: true });

    renderPage('?token=validtoken');

    await user.type(screen.getByLabelText('新密碼'), 'strongpassword123');
    await user.type(screen.getByLabelText('確認新密碼'), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        token: 'validtoken',
        newPassword: 'strongpassword123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { resetSuccess: true },
      });
    });
  });
});

describe('ResetPasswordPage — error states', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockIsPending = false;
  });

  it('shows "連結無效或已過期" for INVALID_RESET_TOKEN', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(
      Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { code: 'INVALID_RESET_TOKEN', message: 'invalid' } },
        },
      }),
    );

    renderPage('?token=expiredtoken');

    await user.type(screen.getByLabelText('新密碼'), 'strongpassword123');
    await user.type(screen.getByLabelText('確認新密碼'), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('連結無效或已過期');
    // Should show re-apply link
    expect(alert.querySelector('a')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows "密碼至少 12 個字元" for WEAK_PASSWORD from server', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(
      Object.assign(new Error('Unprocessable'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { error: { code: 'WEAK_PASSWORD', message: 'weak' } },
        },
      }),
    );

    renderPage('?token=validtoken');

    await user.type(screen.getByLabelText('新密碼'), 'strongpassword123');
    await user.type(screen.getByLabelText('確認新密碼'), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('密碼至少 12 個字元');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error for unknown server errors', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(
      Object.assign(new Error('Internal Server Error'), {
        isAxiosError: true,
        response: { status: 500, data: {} },
      }),
    );

    renderPage('?token=validtoken');

    await user.type(screen.getByLabelText('新密碼'), 'strongpassword123');
    await user.type(screen.getByLabelText('確認新密碼'), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: '確認重設密碼' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('重設失敗，請稍後再試。');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
