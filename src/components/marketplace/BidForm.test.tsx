import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BidForm } from './BidForm';
import { useAuthStore, type AuthUser } from '../../store/authStore';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tier1User: AuthUser = {
  id: 'u1',
  email: 'bidder@example.com',
  displayName: 'Bidder',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 1,
  status: 'ACTIVE',
  emailVerified: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderForm(props: { onSubmit?: () => void; error?: string } = {}) {
  const onSubmit = props.onSubmit ?? vi.fn();
  return {
    onSubmit,
    ...render(
      <BidForm onSubmit={onSubmit} isSubmitting={false} error={props.error} />,
    ),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BidForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: tier1User,
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  // ── render ────────────────────────────────────────────────────────────────

  it('renders the amount input and submit button', () => {
    renderForm();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Bid/i })).toBeInTheDocument();
  });

  it('does not show an error alert on initial render', () => {
    renderForm();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── interaction: empty amount ─────────────────────────────────────────────

  it('shows the "Amount is required" formError in the red alert box when amount is empty', async () => {
    // Regression for audit finding: error ?? formError rendered blank box when
    // error='' (empty string from caller) and formError='Amount is required'.
    // The fix changes ?? to || so falsy-empty error falls through to formError.
    const user = userEvent.setup();
    renderForm({ error: '' }); // caller passes empty error string (initial state)

    await user.click(screen.getByRole('button', { name: /Submit Bid/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Amount is required');
  });

  it('does not call onSubmit when amount is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: /Submit Bid/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ── interaction: caller-provided error ────────────────────────────────────

  it('shows a caller-provided (API) error string in the alert', () => {
    renderForm({ error: 'RATE_LIMITED: too many bids' });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('RATE_LIMITED: too many bids');
  });

  // ── error state ───────────────────────────────────────────────────────────

  it('shows no alert when error is empty and form has not been submitted', () => {
    renderForm({ error: '' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
