/**
 * LiveVideoArea — 16:9 video container.
 *
 * The AI avatar renderer is not yet wired. This component renders the 16:9
 * aspect-ratio frame and always shows AvatarConnectingOverlay as the placeholder.
 * When the LiveKit integration ships, replace the overlay with <video> elements.
 */

import { AvatarConnectingOverlay } from './AvatarConnectingOverlay';

interface LiveVideoAreaProps {
  /** Show the error variant of the overlay (e.g. WebSocket disconnected). */
  hasError?: boolean;
  onRetry?: () => void;
}

export function LiveVideoArea({ hasError = false, onRetry }: LiveVideoAreaProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: 'var(--co-bg-3)',
        borderRadius: 'var(--co-card-r)',
        overflow: 'hidden',
        border: '1px solid var(--co-line-strong)',
        flexShrink: 0,
      }}
    >
      {/* Placeholder: always visible until LiveKit stream is available */}
      <AvatarConnectingOverlay
        variant={hasError ? 'error' : 'connecting'}
        onRetry={onRetry}
      />
    </div>
  );
}

export default LiveVideoArea;
