import { useState } from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { SignatureStatusChip } from './SignatureStatusChip';
import { useAuthStore } from '../../store/authStore';
import type { Contract, Signature } from '../../lib/api/coverones';

interface SignaturePanelProps {
  contract: Contract;
  signatures: Signature[];
  onSign: (hash: string) => void;
  isSigning: boolean;
}

export function SignaturePanel({ contract, signatures, onSign, isSigning }: SignaturePanelProps) {
  const user = useAuthStore((s) => s.user);
  const kycTier = user?.kycTier ?? 0;
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const [signingError, setSigningError] = useState('');

  const clientSig = signatures.find((s) => s.signerUserId === contract.clientUserId);
  const freelancerSig = signatures.find((s) => s.signerUserId === contract.freelancerUserId);
  const userAlreadySigned = signatures.some((s) => s.signerUserId === user?.id);
  const canSign = contract.status === 'PENDING_SIGNATURE' && !userAlreadySigned;
  const isParty = user?.id === contract.clientUserId || user?.id === contract.freelancerUserId;

  // 🔴-2: Sign with the backend-provided canonical contentHash. Recomputing a
  // local sha256 over contract.terms produced a different digest → server 409
  // on every sign attempt. The hash MUST come from the contract payload.
  const handleSign = () => {
    setSigningError('');
    if (!contract.contentHash) {
      setSigningError('Contract content hash is unavailable. Please refresh and try again.');
      return;
    }
    onSign(contract.contentHash);
  };

  if (!isParty) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--co-text)' }}>
        Signatures
      </h3>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SignatureStatusChip role="Client" signed={!!clientSig} />
        <SignatureStatusChip role="Freelancer" signed={!!freelancerSig} />
      </div>

      {signingError && (
        <p role="alert" style={{ fontSize: 13, color: '#FCA5A5' }}>{signingError}</p>
      )}

      {canSign && (
        <div>
          {/* 🟡-1: only surface the KYC gate once auth has hydrated — otherwise the
              tier defaults to 0 mid-hydration and flashes a false "KYC required". */}
          {!isHydrating && kycTier < 2 ? (
            <Tooltip content="KYC Tier 2 required to sign contracts">
              <Button variant="primary" size="md" disabled aria-label="Sign contract (KYC required)">
                Sign Contract
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="primary"
              size="md"
              loading={isSigning || isHydrating}
              disabled={isHydrating}
              onClick={handleSign}
              aria-label="Sign contract"
            >
              Sign Contract
            </Button>
          )}
        </div>
      )}

      {userAlreadySigned && (
        <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>
          You have signed this contract.
        </p>
      )}
    </div>
  );
}

export default SignaturePanel;
