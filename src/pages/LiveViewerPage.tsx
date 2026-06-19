/**
 * LiveViewerPage — /live/:roomId
 *
 * Layout:
 *   Desktop (≥768): left column (video 16:9 + StreamInfoBar) | right (LiveChatPanel)
 *   Mobile (<768): video full-width 16:9, chat below max-height 40vh
 *
 * The video area always shows AvatarConnectingOverlay (no LiveKit yet — scaffold).
 * StreamInfoBar uses the roomId as a placeholder title until the backend ships.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { LiveVideoArea } from '../components/live/LiveVideoArea';
import { StreamInfoBar } from '../components/live/StreamInfoBar';
import { LiveChatPanel } from '../components/live/LiveChatPanel';
import { Icon } from '../components/ui/Icon';

export default function LiveViewerPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Placeholder data — will be fetched from the backend when the streams API ships
  const placeholderTitle = `直播間 ${roomId ?? ''}`;
  const placeholderChannel = '替身主播';
  const placeholderTags = ['AI', '科技'];
  const placeholderViewers = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Back bar */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--co-line)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/live')}
          aria-label="返回直播台列表"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--co-text-dim)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <Icon.ArrowLeft size={16} />
          返回直播台
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 20,
            height: '100%',
            // Mobile: column; desktop: row
            flexDirection: 'column',
          }}
          className="live-viewer-layout"
        >
          {/* Left: video + info */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {/* onRetry is a no-op stub until LiveKit reconnect is implemented */}
            <LiveVideoArea onRetry={() => { /* TODO: trigger LiveKit reconnect when available */ }} />
            <StreamInfoBar
              title={placeholderTitle}
              channelName={placeholderChannel}
              channelAvatarUrl={null}
              viewerCount={placeholderViewers}
              tags={placeholderTags}
              isLive
            />
          </div>

          {/* Right: chat panel */}
          <div
            style={{
              flexShrink: 0,
              // Mobile: max-height 40vh; desktop: fixed width
              maxHeight: '40vh',
              // We override this with a media query comment below — done inline via
              // the className approach but Tailwind v4 can't be mixed here since we
              // use inline styles throughout; use minHeight/height on desktop via JS or
              // accept the single-column stack (which is the mobile-first spec).
            }}
          >
            <LiveChatPanel />
          </div>
        </div>
      </div>

      {/* Desktop layout fix via a style tag — avoids adding a CSS module for a
          single breakpoint adjustment. Tailwind v4 utility classes are not used
          in this file to stay consistent with the inline-style pattern of the
          rest of the codebase. */}
      <style>{`
        @media (min-width: 768px) {
          .live-viewer-layout {
            flex-direction: row !important;
            align-items: flex-start;
            height: calc(100% - 32px);
          }
          .live-viewer-layout > div:last-child {
            width: 320px;
            max-height: none !important;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}
