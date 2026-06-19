/**
 * LiveStreamCard — grid card for the live directory.
 *
 * 16:9 thumbnail area (placeholder shimmer + Video icon + "連線中·即將上線")
 * Red LIVE badge top-left
 * Viewer count overlay bottom-left
 * Below: channel avatar square + 2-line-clamp title + channel name + tag chips
 *
 * a11y: tabIndex=0, role="article", keydown Enter/Space → navigate to /live/:roomId
 * Focus: CSS :focus-visible outline — no imperative onFocus/onBlur manipulation.
 */

import { useNavigate } from 'react-router-dom';
import type { LiveStream } from '../../api/live';
import { Icon } from '../ui/Icon';

interface LiveStreamCardProps {
  stream: LiveStream;
}

export function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const navigate = useNavigate();

  const handleActivate = () => {
    navigate(`/live/${stream.roomId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <>
      {/* :focus-visible outline via injected rule; avoids outline flash on mouse click */}
      <style>{`
        .live-stream-card:focus-visible {
          outline: 2px solid var(--co-accent);
          outline-offset: 2px;
        }
      `}</style>
      <div
        className="live-stream-card"
        role="article"
        tabIndex={0}
        aria-label={`${stream.title} — ${stream.channelName}`}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 'var(--co-card-r)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 150ms, box-shadow 150ms',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = 'var(--co-accent)';
          el.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = 'var(--co-line-strong)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* 16:9 thumbnail */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: 'var(--co-bg-3)',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer placeholder */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, var(--co-bg-3) 25%, var(--co-bg-card-2) 50%, var(--co-bg-3) 75%)',
              backgroundSize: '400px 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />

          {/* Centered video icon + label */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon.Video size={32} style={{ color: 'var(--co-text-dim)', opacity: 0.35 }} />
            <span style={{ fontSize: 11, color: 'var(--co-text-muted)' }}>連線中・即將上線</span>
          </div>

          {/* LIVE badge top-left */}
          <span
            role="status"
            aria-label="直播中"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '2px 7px',
              borderRadius: 'var(--co-badge-r)',
              background: 'var(--co-red)',
              color: 'var(--co-text-on-accent)',
            }}
          >
            LIVE
          </span>

          {/* Viewer count bottom-left */}
          <span
            aria-label={`${stream.viewerCount} 位觀眾`}
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 'var(--co-badge-r)',
              background: 'rgba(0,0,0,0.6)',
              color: 'var(--co-text-on-accent)',
            }}
          >
            <Icon.Eye size={11} />
            {stream.viewerCount.toLocaleString()}
          </span>
        </div>

        {/* Card body */}
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Channel avatar square */}
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                flexShrink: 0,
                background: stream.channelAvatarUrl
                  ? undefined
                  : 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
                backgroundImage: stream.channelAvatarUrl ? `url(${stream.channelAvatarUrl})` : undefined,
                backgroundSize: 'cover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--co-text-on-accent)',
              }}
            >
              {!stream.channelAvatarUrl && (stream.channelName?.charAt(0) || '?').toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 2-line-clamp title */}
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--co-text)',
                  margin: '0 0 3px 0',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {stream.title}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--co-text-dim)',
                  margin: 0,
                }}
              >
                {stream.channelName}
              </p>
            </div>
          </div>

          {/* Tags */}
          {stream.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {stream.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '1px 7px',
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
      </div>
    </>
  );
}

export default LiveStreamCard;
