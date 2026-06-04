import { useState } from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { VerifiedActionGate } from '../auth/VerifiedActionGate';
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

  const handleSign = () => {
    setSigningError('');
    // Use the server-returned contentHash directly. Signing sha256(terms) would produce
    // a different digest; the backend validates against contract.ContentHash (signature_handler.go:68).
    if (!contract.contentHash) {
      setSigningError('合約內容雜湊不可用，請重新整理頁面後再試。');
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
          {/* While hydrating, show a neutral disabled state — NOT a false KYC gate */}
          {isHydrating ? (
            <Button variant="primary" size="md" disabled aria-label="Sign contract (loading)">
              Sign Contract
            </Button>
          ) : kycTier < 2 ? (
            <Tooltip content="KYC Tier 2 required to sign contracts">
              <Button variant="primary" size="md" disabled aria-label="Sign contract (KYC required)">
                Sign Contract
              </Button>
            </Tooltip>
          ) : (
            <VerifiedActionGate>
              <Button
                variant="primary"
                size="md"
                loading={isSigning}
                onClick={handleSign}
                aria-label="Sign contract"
              >
                Sign Contract
              </Button>
            </VerifiedActionGate>
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
