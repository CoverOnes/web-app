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
  ctaLabel = 'Learn more',
}: KycRequiredBannerProps) {
  const defaultMsg = `KYC Tier ${requiredTier} required. Complete identity verification to unlock this feature.`;

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
        color: '#92400e',
      }}
    >
      <Icon.Lock size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>
          Verification Required
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{message ?? defaultMsg}</p>
        {ctaLink && (
          <a
            href={ctaLink}
            style={{ fontSize: 13, color: '#d97706', fontWeight: 600, marginTop: 6, display: 'inline-block' }}
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}

export default KycRequiredBanner;
