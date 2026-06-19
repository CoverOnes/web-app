/**
 * StreamInfoBar — shown below the video on the viewer page.
 * Displays LIVE badge, channel avatar, title, viewer count and tags.
 */

import { Icon } from '../ui/Icon';

interface StreamInfoBarProps {
  title: string;
  channelName: string;
  channelAvatarUrl?: string | null;
  viewerCount: number;
  tags: string[];
  isLive?: boolean;
}

export function StreamInfoBar({
  title,
  channelName,
  channelAvatarUrl,
  viewerCount,
  tags,
  isLive = true,
}: StreamInfoBarProps) {
  return (
    <div
      style={{
        padding: '14px 0 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top row: LIVE badge + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {isLive && (
          <span
            role="status"
            aria-label="直播中"
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '2px 7px',
              borderRadius: 'var(--co-badge-r)',
              background: 'var(--co-red)',
              color: '#fff',
              marginTop: 3,
            }}
          >
            LIVE
          </span>
        )}
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--co-text)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Channel row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Channel avatar */}
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: channelAvatarUrl
              ? undefined
              : 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
            backgroundImage: channelAvatarUrl ? `url(${channelAvatarUrl})` : undefined,
            backgroundSize: 'cover',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {!channelAvatarUrl && channelName.charAt(0).toUpperCase()}
        </div>

        <span style={{ fontSize: 14, color: 'var(--co-text-dim)', fontWeight: 500 }}>
          {channelName}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <Icon.Eye size={13} style={{ color: 'var(--co-text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--co-text-muted)' }}>
            {viewerCount.toLocaleString()}
          </span>
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '2px 9px',
                borderRadius: 'var(--co-badge-r)',
                background: 'var(--co-bdg-dev-bg)',
                color: 'var(--co-bdg-dev-text)',
                border: '1px solid var(--co-bdg-dev-border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default StreamInfoBar;
