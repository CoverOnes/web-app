import type { Person } from '../../types';
import { Avatar } from '../ui/Avatar';

interface TypingIndicatorProps {
  person: Person;
}

const TypingIndicator = ({ person }: TypingIndicatorProps) => (
  <div style={{
    display: 'flex',
    gap: 12,
    marginBottom: 10,
    alignItems: 'flex-end',
  }}>
    <Avatar
      name={person.zh ?? person.name}
      pixelSize={28}
      color={person.color}
      status={person.status}
    />
    <div style={{
      padding: '10px 14px',
      borderRadius: 12,
      background: 'var(--color-bubble-other)',
      border: '1px solid var(--color-main-border)',
      display: 'flex',
      gap: 4,
      alignItems: 'center',
    }}>
      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

export default TypingIndicator;
