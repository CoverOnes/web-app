/**
 * Register.test.tsx
 *
 * Covers: render, user interaction (account type switch, submit), error states.
 * Uses screen.getByRole / getByLabelText per project conventions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock authApi
vi.mock('../lib/api/coverones', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock validation utilities (pass-through by default; override in tests as needed)
vi.mock('../utils/validation', () => ({
  validateLegalName: vi.fn(() => null),
  validateNationalId: vi.fn(() => null),
  validateCompanyName: vi.fn(() => null),
  validatePassword: vi.fn(() => null),
}));

import { authApi } from '../lib/api/coverones';
import {
  validateLegalName,
  validateNationalId,
  validateCompanyName,
  validatePassword,
} from '../utils/validation';

const mockRegister = vi.mocked(authApi.register);
const mockValidateLegalName = vi.mocked(validateLegalName);
const mockValidateNationalId = vi.mocked(validateNationalId);
const mockValidateCompanyName = vi.mocked(validateCompanyName);
const mockValidatePassword = vi.mocked(validatePassword);

function renderPage() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

describe('Register page — render', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    mockValidateLegalName.mockReturnValue(null);
    mockValidateNationalId.mockReturnValue(null);
    mockValidateCompanyName.mockReturnValue(null);
    mockValidatePassword.mockReturnValue(null);
  });

  it('renders the card title', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '建立企業帳號' })).toBeInTheDocument();
  });

  it('renders the stepper with 4 steps', () => {
    renderPage();
    // Step labels visible in stepper — use getAllByText since "密碼" also appears as a label
    expect(screen.getByText('公司')).toBeInTheDocument();
    expect(screen.getByText('負責人')).toBeInTheDocument();
    expect(screen.getAllByText('密碼').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('邀請團隊')).toBeInTheDocument();
  });

  it('renders required form inputs', () => {
    renderPage();
    expect(screen.getByLabelText(/顯示名稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/真實姓名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/企業 Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密碼/, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/確認密碼/, { selector: 'input' })).toBeInTheDocument();
  });

  it('renders account type selector with default PERSONAL', () => {
    renderPage();
    const select = screen.getByLabelText(/帳號類型/);
    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe('PERSONAL');
  });

  it('shows 身分證字號 field for PERSONAL account', () => {
    renderPage();
    expect(screen.getByLabelText(/身分證字號/)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /下一步：設定公司資料/i })).toBeInTheDocument();
  });

  it('renders the login link', () => {
    renderPage();
    // There are two login links (top meta + bottom) — both should have /login href
    const links = screen.getAllByRole('link', { name: /登入/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Register page — account type switching', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    mockValidateLegalName.mockReturnValue(null);
    mockValidateNationalId.mockReturnValue(null);
    mockValidateCompanyName.mockReturnValue(null);
    mockValidatePassword.mockReturnValue(null);
  });

  it('shows 公司名稱 field when COMPANY is selected', async () => {
    const user = userEvent.setup();
    renderPage();

    const select = screen.getByLabelText(/帳號類型/);
    await user.selectOptions(select, 'COMPANY');

    expect(screen.getByLabelText(/公司名稱/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/身分證字號/)).not.toBeInTheDocument();
  });

  it('shows 身分證字號 when switching back to PERSONAL', async () => {
    const user = userEvent.setup();
    renderPage();

    const select = screen.getByLabelText(/帳號類型/);
    await user.selectOptions(select, 'COMPANY');
    await user.selectOptions(select, 'PERSONAL');

    expect(screen.getByLabelText(/身分證字號/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/公司名稱/)).not.toBeInTheDocument();
  });
});

describe('Register page — interaction', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    mockValidateLegalName.mockReturnValue(null);
    mockValidateNationalId.mockReturnValue(null);
    mockValidateCompanyName.mockReturnValue(null);
    mockValidatePassword.mockReturnValue(null);
  });

  it('shows error when required fields are empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /下一步/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請填寫所有必填欄位。');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation error from validatePassword', async () => {
    const user = userEvent.setup();
    mockValidatePassword.mockReturnValue('密碼強度不足，請使用更長或更複雜的密碼（至少 12 字元）。');
    renderPage();

    await user.type(screen.getByLabelText(/顯示名稱/), 'Test User');
    await user.type(screen.getByLabelText(/真實姓名/), '陳俊宇');
    await user.type(screen.getByLabelText(/企業 Email/), 'test@co.com');
    await user.type(screen.getByLabelText(/^密碼/), 'short');
    await user.type(screen.getByLabelText(/確認密碼/, { selector: 'input' }), 'short');
    await user.click(screen.getByRole('button', { name: /下一步/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('密碼強度不足');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/顯示名稱/), 'Test User');
    await user.type(screen.getByLabelText(/真實姓名/), '陳俊宇');
    await user.type(screen.getByLabelText(/企業 Email/), 'test@co.com');
    await user.type(screen.getByLabelText(/^密碼/), 'strongpassword123');
    await user.type(screen.getByLabelText(/確認密碼/, { selector: 'input' }), 'differentpassword123');
    await user.click(screen.getByRole('button', { name: /下一步/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('兩次輸入的密碼不一致。');
  });

  it('calls authApi.register and navigates on success', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ user: { id: 'u1', email: 'test@co.com', displayName: 'Test', avatarUrl: null, accountType: 'PERSONAL', kycTier: 0, status: 'PENDING_VERIFICATION', emailVerified: false } });

    renderPage();

    await user.type(screen.getByLabelText(/顯示名稱/), 'Test User');
    await user.type(screen.getByLabelText(/真實姓名/), '陳俊宇');
    await user.type(screen.getByLabelText(/企業 Email/), 'test@co.com');
    await user.type(screen.getByLabelText(/身分證字號/), 'A123456789');
    await user.type(screen.getByLabelText(/^密碼/), 'strongpassword123');
    await user.type(screen.getByLabelText(/確認密碼/, { selector: 'input' }), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: /下一步/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@co.com',
        displayName: 'Test User',
        accountType: 'PERSONAL',
        legalName: '陳俊宇',
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/register/verify-sent', expect.anything());
    });
  });
});

describe('Register page — error states', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    mockValidateLegalName.mockReturnValue(null);
    mockValidateNationalId.mockReturnValue(null);
    mockValidateCompanyName.mockReturnValue(null);
    mockValidatePassword.mockReturnValue(null);
  });

  it('shows EMAIL_TAKEN error from server as role=alert', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue({
      response: { data: { code: 'EMAIL_TAKEN' } },
    });

    renderPage();

    await user.type(screen.getByLabelText(/顯示名稱/), 'Test User');
    await user.type(screen.getByLabelText(/真實姓名/), '陳俊宇');
    await user.type(screen.getByLabelText(/企業 Email/), 'taken@co.com');
    await user.type(screen.getByLabelText(/身分證字號/), 'A123456789');
    await user.type(screen.getByLabelText(/^密碼/), 'strongpassword123');
    await user.type(screen.getByLabelText(/確認密碼/, { selector: 'input' }), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: /下一步/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('此 email 已被註冊');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows fallback error message when no code or message', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue({ response: { data: {} } });

    renderPage();

    await user.type(screen.getByLabelText(/顯示名稱/), 'Test User');
    await user.type(screen.getByLabelText(/真實姓名/), '陳俊宇');
    await user.type(screen.getByLabelText(/企業 Email/), 'test@co.com');
    await user.type(screen.getByLabelText(/身分證字號/), 'A123456789');
    await user.type(screen.getByLabelText(/^密碼/), 'strongpassword123');
    await user.type(screen.getByLabelText(/確認密碼/, { selector: 'input' }), 'strongpassword123');
    await user.click(screen.getByRole('button', { name: /下一步/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('註冊失敗，請稍後再試。');
  });
});
