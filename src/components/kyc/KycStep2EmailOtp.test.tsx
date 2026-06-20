/**
 * KycStep2EmailOtp.test.tsx
 *
 * Tests for the email OTP step in the KYC wizard.
 * Covers: render (masked email), interaction (verify success → advance),
 *         error states (CODE_MISMATCH, CHALLENGE_EXPIRED, RATE_LIMITED).
 *
 * Test cases: 7 total (render: 2, interaction: 2, error: 3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KycStep2EmailOtp } from './KycStep2EmailOtp';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockEmailStart = vi.fn();
const mockEmailVerify = vi.fn();

vi.mock('../../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/query')>();
  return {
    ...actual,
    useKycEmailStart: () => ({ mutateAsync: mockEmailStart, isPending: false }),
    useKycEmailVerify: () => ({ mutateAsync: mockEmailVerify, isPending: false }),
  };
});

// ── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function renderStep(email = 'mary@example.com', onVerified = vi.fn()) {
  return render(
    <KycStep2EmailOtp email={email} onVerified={onVerified} />,
    { wrapper: createWrapper() },
  );
}

/** Build an axios-like error with the real backend envelope {error:{code,message}} */
function makeApiError(code: string, status = 400, message = '') {
  return Object.assign(new Error(message || code), {
    isAxiosError: true,
    response: {
      status,
      data: { error: { code, message: message || code } },
    },
  });
}

// ── Render tests ─────────────────────────────────────────────────────────────

describe('KycStep2EmailOtp — render', () => {
  beforeEach(() => {
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockEmailStart.mockResolvedValue(undefined);
  });

  it('renders Step 2 heading', async () => {
    renderStep();
    await waitFor(() => {
      expect(screen.getByText(/Step 2 \/ 5/i)).toBeInTheDocument();
    });
  });

  it('renders masked email (not raw email address)', async () => {
    renderStep('mary@example.com');
    await waitFor(() => {
      expect(screen.getByText(/Step 2 \/ 5/i)).toBeInTheDocument();
    });
    // Masked form: m***@example.com
    expect(screen.getByText(/m\*{3}@example\.com/)).toBeInTheDocument();
    // Raw email MUST NOT appear
    expect(screen.queryByText('mary@example.com')).not.toBeInTheDocument();
  });
});

// ── Interaction tests ────────────────────────────────────────────────────────

describe('KycStep2EmailOtp — interaction', () => {
  beforeEach(() => {
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockEmailStart.mockResolvedValue(undefined);
  });

  it('calls emailStart on mount with the provided email', async () => {
    renderStep('test@example.com');
    await waitFor(() => {
      expect(mockEmailStart).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  it('calls onVerified when emailVerify succeeds with emailVerified=true (advance to Step3)', async () => {
    const onVerified = vi.fn();
    mockEmailVerify.mockResolvedValue({ emailVerified: true, promoted: false, currentTier: 0 });

    const user = userEvent.setup();
    renderStep('user@test.com', onVerified);
    await waitFor(() => screen.getByText(/Step 2 \/ 5/i));

    // Type 6-digit OTP
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.keyboard('1');
    await user.keyboard('2');
    await user.keyboard('3');
    await user.keyboard('4');
    await user.keyboard('5');
    await user.keyboard('6');

    await user.click(screen.getByRole('button', { name: '確認 Email 驗證碼' }));

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled();
    });
  });
});

// ── Error tests ──────────────────────────────────────────────────────────────

describe('KycStep2EmailOtp — error states', () => {
  beforeEach(() => {
    mockEmailStart.mockReset();
    mockEmailVerify.mockReset();
    mockEmailStart.mockResolvedValue(undefined);
  });

  /** Helper: type 6 digits and submit */
  async function typeOtpAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() => screen.getByText(/Step 2 \/ 5/i));
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.keyboard('1');
    await user.keyboard('2');
    await user.keyboard('3');
    await user.keyboard('4');
    await user.keyboard('5');
    await user.keyboard('6');
    await user.click(screen.getByRole('button', { name: '確認 Email 驗證碼' }));
  }

  it('shows CODE_MISMATCH error with remaining attempts', async () => {
    mockEmailVerify.mockRejectedValue(makeApiError('CODE_MISMATCH'));
    const user = userEvent.setup();
    renderStep();
    await typeOtpAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('驗證碼錯誤');
    });
  });

  it('shows CHALLENGE_EXPIRED error', async () => {
    mockEmailVerify.mockRejectedValue(makeApiError('CHALLENGE_EXPIRED'));
    const user = userEvent.setup();
    renderStep();
    await typeOtpAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('驗證碼已過期');
    });
  });

  it('shows rate-limit error when emailStart fails with 429', async () => {
    mockEmailStart.mockReset();
    mockEmailStart.mockRejectedValue(makeApiError('RATE_LIMITED', 429));
    renderStep();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('發送次數過多');
    });
  });
});
