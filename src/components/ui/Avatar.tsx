interface AvatarProps {
  name: string;
  src?: string;
  // Size preset (used when pixelSize not provided)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  showDot?: boolean; // alias for showStatus
  status?: 'online' | 'away' | 'offline';
  className?: string;
  // NEW: exact pixel size (overrides size preset)
  pixelSize?: number;
  // NEW: gradient colors [from, to] — renders gradient background when provided
  color?: [string, string];
  // NEW: adds 2px ring using sb-bg color
  ring?: boolean;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 72,
};

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-[72px] h-[72px] text-xl',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic background color based on name hash */
function getInitialsBg(name: string): string {
  const palette = [
    'bg-primary-600',
    'bg-primary-700',
    'bg-primary-500',
    'bg-accent-600',
    'bg-primary-800',
    'bg-accent-500',
    'bg-primary-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({
  name,
  src,
  size = 'md',
  showStatus = false,
  showDot = false,
  status = 'offline',
  className = '',
  pixelSize,
  color,
  ring = false,
}: AvatarProps) {
  const showStatusDot = showStatus || showDot;
  const resolvedSize = pixelSize ?? sizeMap[size];
  const borderRadius = resolvedSize >= 40 ? 12 : 10;
  const fontSize = Math.round(resolvedSize * 0.38);
  const dotSize = Math.max(8, Math.round(resolvedSize * 0.28));

  if (pixelSize !== undefined || color !== undefined) {
    // Pixel-precise rendering for new design system
    const ringStyle = ring
      ? { boxShadow: '0 0 0 2px var(--color-sb-bg)' }
      : {};

    return (
      <div style={{ position: 'relative', width: resolvedSize, height: resolvedSize, flexShrink: 0 }} className={className}>
        {src ? (
          <img
            src={src}
            alt={`${name} 的頭像`}
            style={{ width: resolvedSize, height: resolvedSize, borderRadius, objectFit: 'cover', ...ringStyle }}
          />
        ) : (
          <div
            role="img"
            aria-label={name}
            style={{
              width: resolvedSize,
              height: resolvedSize,
              borderRadius,
              background: color
                ? `linear-gradient(135deg, ${color[0]}, ${color[1]})`
                : 'var(--co-text-dim)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize,
              letterSpacing: '-0.02em',
              userSelect: 'none',
              ...ringStyle,
            }}
          >
            {getInitials(name)}
          </div>
        )}
        {showStatusDot && status !== 'offline' && (
          <div
            aria-label={`狀態：${status}`}
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              background: status === 'online' ? 'var(--color-green)' : 'var(--color-amber)',
              boxShadow: status === 'online'
                ? '0 0 0 2px var(--color-sb-bg), 0 0 0 3px rgba(5,150,105,0.25)'
                : '0 0 0 2px var(--color-sb-bg)',
            }}
          />
        )}
      </div>
    );
  }

  // Legacy rendering path (size preset, Tailwind classes)
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  const bgColor = getInitialsBg(name);

  const statusDotSizeClass = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3 h-3 border-2',
    xl: 'w-3.5 h-3.5 border-2',
  }[size];

  const statusDotColorClass = {
    online: 'bg-success-500',
    away: 'bg-warning-500',
    offline: 'bg-neutral-400',
  }[status];

  return (
    <div className={`relative inline-block flex-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={`${name} 的頭像`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          role="img"
          className={`
            ${sizeClasses[size]} ${bgColor}
            rounded-full flex items-center justify-center
            text-white font-semibold select-none
          `}
          aria-label={name}
        >
          {initials}
        </div>
      )}
      {showStatusDot && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full
            border-white
            ${statusDotSizeClass}
            ${statusDotColorClass}
          `}
          aria-label={`狀態：${status}`}
        />
      )}
    </div>
  );
}

export default Avatar;
