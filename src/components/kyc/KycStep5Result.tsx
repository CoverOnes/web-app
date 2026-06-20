import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface KycStep5ResultProps {
  currentTier: number;
  isPending: boolean;
}

export function KycStep5Result({ currentTier, isPending }: KycStep5ResultProps) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-text)', marginBottom: 6 }}>
          Step 5 / 5 — 認證結果
        </h2>
      </div>

      {isPending ? (
        /* Pending manual review (non-dev environment) */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 20,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 999,
              background: 'rgba(245,158,11,0.15)',
              color: '#FCD34D',
              fontSize: 13,
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            審核中
          </div>
          <p style={{ fontSize: 14, color: 'var(--co-text-dim)', lineHeight: 1.6, margin: 0 }}>
            您的 KYC 申請已提交，我們將在工作日內完成審核。通過後將以 Email 通知您。
          </p>
        </div>
      ) : (
        /* Approved — show tier badge */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 20,
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 999,
              background: 'rgba(16,185,129,0.15)',
              color: 'var(--co-green)',
              fontSize: 13,
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 7l2 2.5 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            KYC Tier {currentTier} 已驗證
          </div>
          <p style={{ fontSize: 14, color: 'var(--co-text-dim)', lineHeight: 1.6, margin: 0 }}>
            {currentTier >= 2
              ? '恭喜！您的身分已通過完整認證，現在可以發布案件與提交投標。'
              : '您已完成基本 Email + 手機驗證（Tier 1），可存取一般功能。進行身分認證（Tier 2）後可解鎖發案與投標。'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" size="md" onClick={() => navigate('/jobs')}>
          前往案件看板
        </Button>
        <Button variant="secondary" size="md" onClick={() => navigate('/bids')}>
          我的投標
        </Button>
      </div>
    </div>
  );
}

export default KycStep5Result;
