/**
 * ForgotPasswordPage.test.tsx
 *
 * Covers: render, user interaction (submit), success on both API paths.
 * CRITICAL: success state must appear on BOTH api-success AND api-error paths
 * (anti-enumeration — never reveals whether the email exists).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForgotPasswordPage from './ForgotPasswordPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the query hook
const mockMutateAsync = vi.fn();
vi.mock('../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/query')>();
  return {
    ...actual,
    useForgotPassword: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<ForgotPasswordPage />, { wrapper: createWrapper() });
}

describe('ForgotPasswordPage — render', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '忘記密碼' })).toBeInTheDocument();
  });

  it('renders the email input with label', () => {
    renderPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '寄送重設連結' })).toBeInTheDocument();
  });

  it('renders the back-to-login button', () => {
    renderPage();
    // There are two: a button and a link — find the button
    expect(screen.getByRole('button', { name: '返回登入' })).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage — interaction', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
  });

  it('calls useForgotPassword mutateAsync with the email on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ message: 'ok' });

    renderPage();

    await user.type(screen.getByLabelText('Email'), 'test@company.com');
    await user.click(screen.getByRole('button', { name: '寄送重設連結' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('test@company.com');
    });
  });

  it('shows generic success copy after successful API call (anti-enumeration)', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ message: 'ok' });

    renderPage();

    await user.type(screen.getByLabelText('Email'), 'test@company.com');
    await user.click(screen.getByRole('button', { name: '寄送重設連結' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '確認信已寄出' })).toBeInTheDocument();
    });
    // Must NOT reveal whether email exists
    expect(screen.getByRole('status')).toHaveTextContent('若該信箱存在');
  });

  it('shows generic success copy even when API throws (anti-enumeration)', async () => {
    const user = userEvent.setup();
    // API rejects — page must still show the generic sent screen
    mockMutateAsync.mockRejectedValue(
      Object.assign(new Error('Not Found'), {
        isAxiosError: true,
        response: { data: { error: { code: 'SOME_ERROR', message: 'error' } } },
      }),
    );

    renderPage();

    await user.type(screen.getByLabelText('Email'), 'nonexistent@company.com');
    await user.click(screen.getByRole('button', { name: '寄送重設連結' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '確認信已寄出' })).toBeInTheDocument();
    });
    // Same generic copy — never reveals existence
    expect(screen.getByRole('status')).toHaveTextContent('若該信箱存在');
  });

  it('does not call API when email field is empty', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: '寄送重設連結' }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
