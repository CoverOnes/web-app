import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

interface KycRequiredBannerProps {
  requiredTier: number;
  message?: string;
  ctaLink?: string;
  ctaLabel?: string;
}

export function KycRequiredBanner({
  requiredTier,
  message,
  ctaLink,
  ctaLabel = '了解更多',
}: KycRequiredBannerProps) {
  const defaultMsg = `需完成 KYC Tier ${requiredTier} 身分驗證後，才能使用此功能。`;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'var(--color-warning-100)',
        border: '1px solid var(--color-amber)',
        color: 'var(--color-warning-900)',
      }}
    >
      <Icon.Lock size={18} style={{ color: 'var(--color-warning-700)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>
          需要身分驗證
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{message ?? defaultMsg}</p>
        {ctaLink && (
          <Link
            to={ctaLink}
            style={{ fontSize: 13, color: 'var(--color-warning-700)', fontWeight: 600, marginTop: 6, display: 'inline-block' }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export default KycRequiredBanner;
