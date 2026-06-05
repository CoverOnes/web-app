/**
 * Login.test.tsx
 *
 * Covers: render, user interaction (submit, password toggle), error states.
 * Uses screen.getByRole / getByLabelText / getByText per project conventions (no getByTestId).
 * Auth API is mocked; router is wrapped with MemoryRouter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { useAuthStore } from '../store/authStore';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock authApi
vi.mock('../lib/api/coverones', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from '../lib/api/coverones';
const mockLogin = vi.mocked(authApi.login);
const mockMe = vi.mocked(authApi.me);

function renderPage() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login page — render', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    // Reset auth store
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('renders the card title', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '登入企業帳號' })).toBeInTheDocument();
  });

  it('renders the email input with visible label', () => {
    renderPage();
    expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
  });

  it('renders the password input with visible label', () => {
    renderPage();
    expect(screen.getByLabelText('密碼')).toBeInTheDocument();
  });

  it('renders the primary submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /登入 CoverOnes/i })).toBeInTheDocument();
  });

  it('renders the sign-up link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: '立即註冊企業' })).toBeInTheDocument();
  });

  it('renders SSO options', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /使用 Google 登入/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /使用 Apple 登入/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /使用 LINE 登入/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /企業單一登入/i })).toBeInTheDocument();
  });
});

describe('Login page — interaction', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /登入 CoverOnes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請輸入 Email。');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error when password is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('電子郵件'), 'test@company.com');
    await user.click(screen.getByRole('button', { name: /登入 CoverOnes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請輸入密碼。');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('toggles password visibility when show button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const passwordInput = screen.getByLabelText('密碼');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '顯示密碼' });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '隱藏密碼' })).toBeInTheDocument();
  });

  it('calls authApi.login and navigates on successful login', async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref', tokenType: 'Bearer', expiresIn: 3600 });
    mockMe.mockResolvedValue({
      id: 'u1', email: 'test@co.com', displayName: 'Test', avatarUrl: null,
      accountType: 'COMPANY', kycTier: 1, status: 'ACTIVE', emailVerified: true,
    });

    renderPage();

    await user.type(screen.getByLabelText('電子郵件'), 'test@co.com');
    await user.type(screen.getByLabelText('密碼'), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: /登入 CoverOnes/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@co.com', password: 'strongpassword123' });
      // Two-phase login: after getting the token, authApi.me must be called with the issued token.
      expect(mockMe).toHaveBeenCalledWith('acc');
      expect(mockNavigate).toHaveBeenCalledWith('/jobs', { replace: true });
    });
  });
});

describe('Login page — error states', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockMe.mockReset();
    mockNavigate.mockReset();
    useAuthStore.setState({
      accessToken: null, refreshToken: null, user: null,
      isAuthenticated: false, isHydrating: false,
    });
  });

  it('shows server error as role=alert when login fails', async () => {
    const user = userEvent.setup();

    mockLogin.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { isAxiosError: true, response: { data: { message: '帳號或密碼錯誤。' } } }),
    );

    renderPage();

    await user.type(screen.getByLabelText('電子郵件'), 'bad@co.com');
    await user.type(screen.getByLabelText('密碼'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /登入 CoverOnes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('帳號或密碼錯誤。');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows fallback error message when no server message', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(
      Object.assign(new Error('unknown'), { isAxiosError: true, response: { data: {} } }),
    );

    renderPage();

    await user.type(screen.getByLabelText('電子郵件'), 'bad@co.com');
    await user.type(screen.getByLabelText('密碼'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /登入 CoverOnes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('登入失敗，請確認您的帳號與密碼。');
  });
});
