import { Icon } from '../ui/Icon';

interface EncryptionBadgeProps {
  color?: string;
}

const EncryptionBadge = ({ color = 'var(--color-cyan)' }: EncryptionBadgeProps) => (
  <span
    title="AES-256-GCM v2 · end-to-end encrypted"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 10,
      color,
      opacity: 0.7,
    }}
  >
    <Icon.LockSmall size={9} />
  </span>
);

export default EncryptionBadge;
