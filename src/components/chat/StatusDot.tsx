import type { MessageStatus } from '../../types';
import { Icon } from '../ui/Icon';

interface StatusDotProps {
  status: MessageStatus;
}

const StatusDot = ({ status }: StatusDotProps) => {
  if (status === 'sending') {
    return (
      <span style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: 999,
        border: '1.5px solid currentColor',
        opacity: 0.5,
        flexShrink: 0,
      }} />
    );
  }
  if (status === 'sent') {
    return <Icon.Check size={12} style={{ opacity: 0.6, flexShrink: 0 }} />;
  }
  if (status === 'delivered') {
    return <Icon.CheckDouble size={13} style={{ opacity: 0.6, flexShrink: 0 }} />;
  }
  if (status === 'read') {
    return <Icon.CheckDouble size={13} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />;
  }
  return null;
};

export default StatusDot;
