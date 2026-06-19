/**
 * ControlBar — host broadcast controls.
 *
 * Contains: 開始/結束直播 buttons, Mic toggle, Camera toggle, and a status row
 * (status dot + viewer count + duration timer placeholder).
 * The 開始直播 button calls the provided onStart callback (which invokes
 * postAvatarSession in LiveHostPage). 結束直播 calls onStop.
 */

import { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';

interface ControlBarProps {
  isLive: boolean;
  viewerCount: number;
  isPending: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ControlBar({ isLive, viewerCount, isPending, onStart, onStop }: ControlBarProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  // Timer: seconds since going live
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLive) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 'var(--co-card-r)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Primary action buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isLive ? (
          <button
            type="button"
            onClick={onStart}
            disabled={isPending}
            aria-label="開始直播"
            style={{
              flex: 1,
              padding: '9px 0',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--co-btn-r)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(90deg, var(--co-btn-primary-from), var(--co-btn-primary-to))',
              color: 'var(--co-text-on-accent)',
              opacity: isPending ? 0.7 : 1,
              transition: 'opacity 150ms',
            }}
          >
            {isPending ? '連線中…' : '開始直播'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            aria-label="結束直播"
            style={{
              flex: 1,
              padding: '9px 0',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--co-btn-r)',
              cursor: 'pointer',
              background: 'var(--co-red)',
              color: 'var(--co-text-on-accent)',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            結束直播
          </button>
        )}

        {/* Mic toggle — min 44×44 touch target */}
        <button
          type="button"
          aria-label={micOn ? '靜音麥克風' : '取消靜音麥克風'}
          aria-pressed={!micOn}
          onClick={() => setMicOn((v) => !v)}
          title={micOn ? '靜音麥克風' : '取消靜音'}
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            border: '1px solid var(--co-line-strong)',
            borderRadius: 'var(--co-btn-r)',
            background: micOn ? 'var(--co-bg-card-2)' : 'rgba(239,68,68,0.15)',
            color: micOn ? 'var(--co-text)' : 'var(--co-red)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms',
          }}
        >
          {micOn ? <Icon.Mic size={16} /> : <Icon.MicOff size={16} />}
        </button>

        {/* Camera toggle — min 44×44 touch target */}
        <button
          type="button"
          aria-label={camOn ? '關閉攝影機' : '開啟攝影機'}
          aria-pressed={!camOn}
          onClick={() => setCamOn((v) => !v)}
          title={camOn ? '關閉攝影機' : '開啟攝影機'}
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            border: '1px solid var(--co-line-strong)',
            borderRadius: 'var(--co-btn-r)',
            background: camOn ? 'var(--co-bg-card-2)' : 'rgba(239,68,68,0.15)',
            color: camOn ? 'var(--co-text)' : 'var(--co-red)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms',
          }}
        >
          {camOn ? <Icon.Video size={16} /> : <Icon.VideoOff size={16} />}
        </button>
      </div>

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--co-text-muted)' }}>
        {/* Status dot + label — live-status announced to screen readers */}
        <span
          role="status"
          aria-live="polite"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isLive ? 'var(--co-red)' : 'var(--co-text-muted)',
              flexShrink: 0,
              boxShadow: isLive ? '0 0 6px var(--co-red)' : 'none',
            }}
          />
          {isLive ? '直播中' : '未直播'}
        </span>

        {/* Viewer count */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon.Eye size={12} />
          {viewerCount.toLocaleString()} 位觀眾
        </span>

        {/* Timer — labelled for screen readers */}
        <span
          aria-label={`直播時長 ${formatDuration(elapsed)}`}
          style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatDuration(elapsed)}
        </span>
      </div>
    </div>
  );
}

export default ControlBar;
