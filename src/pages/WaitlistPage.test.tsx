/**
 * WaitlistPage.test.tsx
 *
 * Covers: render, validation (empty/invalid email), user interaction (success,
 * error). Uses screen.getByRole / getByLabelText / getByText per project
 * conventions (no getByTestId). Mutation is mocked via vi.mock on query.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WaitlistPage from './WaitlistPage';

// ── Mock useJoinWaitlist ──────────────────────────────────────────────────────
// We mock the hook at the query.ts level so the component gets predictable
// mutation state without spinning up a real QueryClient.

const mockMutate = vi.fn();
let mockIsPending = false;
let mockIsSuccess = false;
let mockIsError = false;
let mockError: unknown = null;

vi.mock('../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/query')>();
  return {
    ...actual,
    useJoinWaitlist: () => ({
      mutate: mockMutate,
      isPending: mockIsPending,
      isSuccess: mockIsSuccess,
      isError: mockIsError,
      error: mockError,
    }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <WaitlistPage />
    </MemoryRouter>,
  );
}

function resetMockState() {
  mockMutate.mockReset();
  mockIsPending = false;
  mockIsSuccess = false;
  mockIsError = false;
  mockError = null;
}

// ── Render tests ──────────────────────────────────────────────────────────────

describe('WaitlistPage — render', () => {
  beforeEach(resetMockState);

  it('renders the card heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '申請加入候補名單' })).toBeInTheDocument();
  });

  it('renders the email input with label', () => {
    renderPage();
    expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
  });

  it('renders the optional company input', () => {
    renderPage();
    expect(screen.getByLabelText(/公司名稱/)).toBeInTheDocument();
  });

  it('renders the optional interestedIn input', () => {
    renderPage();
    expect(screen.getByLabelText(/感興趣的功能/)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /申請加入候補/i })).toBeInTheDocument();
  });

  it('renders a link back to login', () => {
    renderPage();
    // "立即登入" link in the footer
    expect(screen.getByRole('link', { name: '立即登入' })).toBeInTheDocument();
  });

  it('does NOT show success state initially', () => {
    renderPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does NOT show error banner initially', () => {
    renderPage();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Validation tests ──────────────────────────────────────────────────────────

describe('WaitlistPage — validation', () => {
  beforeEach(resetMockState);

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /申請加入候補/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請輸入 Email。');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/電子郵件/), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /申請加入候補/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請輸入有效的 Email 格式。');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does NOT show validation error for whitespace-only email', async () => {
    // Whitespace-only trims to empty → triggers "請輸入 Email。" (not format error)
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/電子郵件/), '   ');
    await user.click(screen.getByRole('button', { name: /申請加入候補/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('請輸入 Email。');
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

// ── Interaction / success tests ───────────────────────────────────────────────

describe('WaitlistPage — interaction (success)', () => {
  beforeEach(resetMockState);

  it('calls mutate with trimmed email on valid submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/電子郵件/), 'test@company.com');
    await user.click(screen.getByRole('button', { name: /申請加入候補/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@company.com',
        company: undefined,
        interestedIn: undefined,
      });
    });
  });

  it('includes optional company and interestedIn when filled', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/電子郵件/), 'cto@acme.com.tw');
    await user.type(screen.getByLabelText(/公司名稱/), 'Acme Corp');
    await user.type(screen.getByLabelText(/感興趣的功能/), '媒合平台');
    await user.click(screen.getByRole('button', { name: /申請加入候補/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'cto@acme.com.tw',
        company: 'Acme Corp',
        interestedIn: '媒合平台',
      });
    });
  });

  it('shows success state (已加入候補) after mutation succeeds', async () => {
    // Simulate isSuccess=true (mutation resolved)
    mockIsSuccess = true;
    renderPage();

    // The success state replaces the form
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('已加入候補！');
  });

  it('does not render the form in success state', () => {
    mockIsSuccess = true;
    renderPage();

    expect(screen.queryByRole('button', { name: /申請加入候補/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/電子郵件/)).not.toBeInTheDocument();
  });

  it('shows a "返回登入" link in the success state', () => {
    mockIsSuccess = true;
    renderPage();

    expect(screen.getByRole('link', { name: /返回登入/i })).toBeInTheDocument();
  });
});

// ── Error state tests ─────────────────────────────────────────────────────────

describe('WaitlistPage — error state', () => {
  beforeEach(resetMockState);

  it('shows a network error message via role=alert', () => {
    mockIsError = true;
    mockError = {
      response: { data: { error: { message: '伺服器錯誤，請稍後再試。' } } },
    };
    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('伺服器錯誤，請稍後再試。');
  });

  it('shows fallback error when no server message', () => {
    mockIsError = true;
    mockError = { message: '網路錯誤' };
    renderPage();

    const alert = screen.getByRole('alert');
    // Falls back to error.message
    expect(alert).toHaveTextContent('網路錯誤');
  });

  it('shows fallback message when error has no useful info', () => {
    mockIsError = true;
    mockError = {};
    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('提交失敗，請稍後再試。');
  });

  it('still renders the form in error state (user can retry)', () => {
    mockIsError = true;
    mockError = {};
    renderPage();

    expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /申請加入候補/i })).toBeInTheDocument();
  });
});
