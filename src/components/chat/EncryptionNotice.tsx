import { Icon } from '../ui/Icon';

const EncryptionNotice = () => (
  <div style={{
    margin: '0 auto 18px auto',
    maxWidth: 480,
    textAlign: 'center',
    padding: '10px 14px',
    borderRadius: 10,
    background: 'var(--color-main-bg-2)',
    border: '1px solid var(--color-main-border)',
    fontSize: 12,
    color: 'var(--color-main-text-dim)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  }}>
    <Icon.LockSmall size={11} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
    <span>此對話受&nbsp;<b>AES-256-GCM v2</b>&nbsp;端對端加密保護</span>
  </div>
);

export default EncryptionNotice;
