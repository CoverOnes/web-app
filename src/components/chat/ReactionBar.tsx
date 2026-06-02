import { Icon } from '../ui/Icon';

interface ReactionBarProps {
  own: boolean;
  onReact: (emoji: string) => void;
}

const reactions = ['👍', '❤️', '🎉', '👀'];

const ReactionBar = ({ own, onReact }: ReactionBarProps) => (
  <div
    className="reaction-bar"
    style={{
      position: 'absolute',
      top: -14,
      ...(own ? { left: 8 } : { right: 8 }),
      background: 'var(--color-main-bg-2)',
      border: '1px solid var(--color-main-border)',
      borderRadius: 999,
      padding: '3px 6px',
      display: 'flex',
      gap: 2,
      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
      opacity: 0,
      transform: 'translateY(4px)',
      transition: 'opacity 150ms ease-out, transform 150ms ease-out',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    {reactions.map(r => (
      <button
        key={r}
        onClick={() => onReact(r)}
        aria-label={`反應 ${r}`}
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 120ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {r}
      </button>
    ))}
    <button
      aria-label="更多反應"
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-main-text-dim)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <Icon.Smile size={13} />
    </button>
  </div>
);

export default ReactionBar;
