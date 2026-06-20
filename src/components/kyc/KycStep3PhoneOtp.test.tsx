/**
 * KycStep3PhoneOtp.test.tsx
 *
 * Tests for the phone OTP step in the KYC wizard.
 * Covers: render, interaction (success advance), error states
 *         (CODE_MISMATCH, CHALLENGE_EXPIRED, MAX_ATTEMPTS).
 *
 * Test cases: 8 total (render: 2, interaction: 2, error: 4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KycStep3PhoneOtp } from './KycStep3PhoneOtp';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPhoneStart = vi.fn();
const mockPhoneVerify = vi.fn();

vi.mock('../../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/query')>();
  return {
    ...actual,
    useKycPhoneStart: () => ({ mutateAsync: mockPhoneStart, isPending: false }),
    useKycPhoneVerify: () => ({ mutateAsync: mockPhoneVerify, isPending: false }),
  };
});

// ── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function renderStep(phone = '+886912345678', onVerified = vi.fn()) {
  return render(
    <KycStep3PhoneOtp phone={phone} onVerified={onVerified} />,
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

describe('KycStep3PhoneOtp — render', () => {
  beforeEach(() => {
    mockPhoneStart.mockReset();
    mockPhoneVerify.mockReset();
    mockPhoneStart.mockResolvedValue(undefined);
  });

  it('renders Step 3 heading', async () => {
    renderStep();
    await waitFor(() => {
      expect(screen.getByText(/Step 3 \/ 5/i)).toBeInTheDocument();
    });
  });

  it('renders masked phone number (not the raw number)', async () => {
    renderStep('+886912345678');
    await waitFor(() => {
      expect(screen.getByText(/Step 3 \/ 5/i)).toBeInTheDocument();
    });
    // Masked form: +886****5678
    expect(screen.getByText(/\+886\*{4}5678/)).toBeInTheDocument();
    // Raw phone MUST NOT appear
    expect(screen.queryByText('+886912345678')).not.toBeInTheDocument();
  });
});

// ── Interaction tests ────────────────────────────────────────────────────────

describe('KycStep3PhoneOtp — interaction', () => {
  beforeEach(() => {
    mockPhoneStart.mockReset();
    mockPhoneVerify.mockReset();
    mockPhoneStart.mockResolvedValue(undefined);
  });

  it('calls phoneStart on mount with the provided phone', async () => {
    renderStep('+886912345678');
    await waitFor(() => {
      expect(mockPhoneStart).toHaveBeenCalledWith({ phone: '+886912345678' });
    });
  });

  it('calls onVerified when phoneVerify succeeds with phoneVerified=true', async () => {
    const onVerified = vi.fn();
    mockPhoneVerify.mockResolvedValue({ phoneVerified: true, promoted: false, currentTier: 1 });

    const user = userEvent.setup();
    renderStep('+886912345678', onVerified);
    await waitFor(() => screen.getByText(/Step 3 \/ 5/i));

    // Type 6-digit OTP
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.keyboard('1');
    await user.keyboard('2');
    await user.keyboard('3');
    await user.keyboard('4');
    await user.keyboard('5');
    await user.keyboard('6');

    await user.click(screen.getByRole('button', { name: '確認手機驗證碼' }));

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalledWith(false, 1);
    });
  });
});

// ── Error tests ──────────────────────────────────────────────────────────────

describe('KycStep3PhoneOtp — error states', () => {
  beforeEach(() => {
    mockPhoneStart.mockReset();
    mockPhoneVerify.mockReset();
    mockPhoneStart.mockResolvedValue(undefined);
  });

  /** Helper: type 6 digits into the OTP input boxes and submit */
  async function typeOtpAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() => screen.getByText(/Step 3 \/ 5/i));
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.keyboard('1');
    await user.keyboard('2');
    await user.keyboard('3');
    await user.keyboard('4');
    await user.keyboard('5');
    await user.keyboard('6');
    await user.click(screen.getByRole('button', { name: '確認手機驗證碼' }));
  }

  it('shows CODE_MISMATCH error with remaining attempts', async () => {
    mockPhoneVerify.mockRejectedValue(makeApiError('CODE_MISMATCH'));
    const user = userEvent.setup();
    renderStep();
    await typeOtpAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('驗證碼錯誤');
    });
  });

  it('shows CHALLENGE_EXPIRED error', async () => {
    mockPhoneVerify.mockRejectedValue(makeApiError('CHALLENGE_EXPIRED'));
    const user = userEvent.setup();
    renderStep();
    await typeOtpAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('驗證碼已過期');
    });
  });

  it('shows MAX_ATTEMPTS error', async () => {
    mockPhoneVerify.mockRejectedValue(makeApiError('MAX_ATTEMPTS'));
    const user = userEvent.setup();
    renderStep();
    await typeOtpAndSubmit(user);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('嘗試次數過多');
    });
  });

  it('shows rate-limit error when phoneStart fails with 429', async () => {
    mockPhoneStart.mockReset();
    mockPhoneStart.mockRejectedValue(makeApiError('RATE_LIMITED', 429));
    renderStep();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('發送次數過多');
    });
  });
});
