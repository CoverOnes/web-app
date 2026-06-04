import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignaturePanel } from './SignaturePanel';
import { useAuthStore, type AuthUser } from '../../store/authStore';
import type { Contract, Signature } from '../../lib/api/coverones';

// A Tier-2, email-verified user who is the contract's freelancer party — this is the
// only state in which the real "Sign Contract" button renders and is clickable
// (isHydrating=false, kycTier>=2, emailVerified=true so VerifiedActionGate passes).
const SIGNER: AuthUser = {
  id: 'freelancer-1',
  email: 'freelancer@example.com',
  displayName: 'Freelancer One',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

// The server-computed canonical hash. Deliberately NOT equal to sha256(terms) for any
// real algorithm — this sentinel value is what the assertion pins on, so if anyone
// reverts handleSign to sign sha256(contract.terms) the payload would differ and the
// test below fails.
const SERVER_CONTENT_HASH = 'server-canonical-hash-DEADBEEF';

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-1',
    listingId: 'listing-1',
    clientUserId: 'client-1',
    freelancerUserId: SIGNER.id,
    title: 'Test Contract',
    terms: 'These are the contract terms that the user must sign.',
    amount: '1000',
    currency: 'USD',
    status: 'PENDING_SIGNATURE',
    createdAt: '2026-01-01T00:00:00Z',
    contentHash: SERVER_CONTENT_HASH,
    ...overrides,
  };
}

describe('SignaturePanel — signs the server contentHash (regression)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: SIGNER,
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  it('(a) clicking sign passes the server contract.contentHash (NOT sha256(terms)) to onSign', async () => {
    const onSign = vi.fn();
    const contract = makeContract();
    const signatures: Signature[] = [];

    render(
      <SignaturePanel
        contract={contract}
        signatures={signatures}
        onSign={onSign}
        isSigning={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign contract' }));

    // Load-bearing assertion: the signed hash MUST be the server-returned
    // contract.contentHash. If handleSign is reverted to sign sha256(contract.terms),
    // onSign receives a different digest and this expectation fails.
    expect(onSign).toHaveBeenCalledTimes(1);
    expect(onSign).toHaveBeenCalledWith(SERVER_CONTENT_HASH);
    expect(onSign).toHaveBeenCalledWith(contract.contentHash);
  });

  it('(b) blocks signing with an error guard and fires no onSign when contentHash is empty', async () => {
    const onSign = vi.fn();
    const contract = makeContract({ contentHash: '' });
    const signatures: Signature[] = [];

    render(
      <SignaturePanel
        contract={contract}
        signatures={signatures}
        onSign={onSign}
        isSigning={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign contract' }));

    // Guard at SignaturePanel.tsx:32-34 must short-circuit: no signature is emitted.
    expect(onSign).not.toHaveBeenCalled();
    // And the user sees the error message instead of a silent no-op.
    expect(
      screen.getByText('合約內容雜湊不可用，請重新整理頁面後再試。'),
    ).toBeInTheDocument();
  });
});
