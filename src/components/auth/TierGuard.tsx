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
            background: 'var(--co-bg-card-2)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 16,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <KycRequiredBanner
            requiredTier={requiredTier}
            message={`需要 KYC Tier ${requiredTier} 認證才能使用此功能。完成身分驗證即可解鎖。`}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" size="md" onClick={() => navigate('/kyc')}>
              完成 KYC 認證
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/jobs')}>
              返回案件看板
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <KycRequiredBanner requiredTier={requiredTier} />;
}

export default TierGuard;
