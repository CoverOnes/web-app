import type { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import KycRequiredBanner from './KycRequiredBanner';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface TierGuardProps {
  requiredTier: number;
  children: ReactNode;
  /** If true, renders full-page banner instead of inline */
  fullPage?: boolean;
}

export function TierGuard({ requiredTier, children, fullPage = false }: TierGuardProps) {
  const tier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const navigate = useNavigate();

  if (tier >= requiredTier) {
    return <>{children}</>;
  }

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: 32,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <KycRequiredBanner requiredTier={requiredTier} />
          <Button variant="secondary" size="md" onClick={() => navigate('/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return <KycRequiredBanner requiredTier={requiredTier} />;
}

export default TierGuard;
