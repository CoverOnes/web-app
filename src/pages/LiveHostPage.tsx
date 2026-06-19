/**
 * LiveHostPage — /live/host
 *
 * Human-operator host control page.
 *
 * Layout:
 *   Left:  LiveVideoArea (preview) + ControlBar (start/stop/mic/cam) + status row
 *   Right: StreamSettingsPanel (title, tags, language)
 *
 * Mobile: single column stack
 *
 * 開始直播 calls postAvatarSession → stores the AvatarSession in local state.
 * 結束直播 calls endAvatarSession stub.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { postAvatarSession, endAvatarSession } from '../api/live';
import type { AvatarSession } from '../api/live';
import { PageHead } from '../components/layout/PageHead';
import { LiveVideoArea } from '../components/live/LiveVideoArea';
import { ControlBar } from '../components/live/ControlBar';
import { StreamSettingsPanel } from '../components/live/StreamSettingsPanel';
import { Icon } from '../components/ui/Icon';

export default function LiveHostPage() {
  const navigate = useNavigate();

  // Stream settings
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [language, setLanguage] = useState('zh-TW');

  // Session state
  const [session, setSession] = useState<AvatarSession | null>(null);
  const [viewerCount] = useState(0);

  const startMutation = useMutation({
    mutationFn: () =>
      postAvatarSession({ title: title || '替身直播', tags: selectedTags, language }),
    onSuccess: (data) => {
      setSession(data);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => (session ? endAvatarSession(session.room) : Promise.resolve()),
    onSuccess: () => {
      setSession(null);
    },
  });

  const isLive = session !== null;

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageHead
        crumb="主選單 / 替身直播 / 主播控制台"
        title="主播控制台"
        actions={
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
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-btn-r)',
              cursor: 'pointer',
              padding: '6px 12px',
            }}
          >
            <Icon.ArrowLeft size={14} />
            返回列表
          </button>
        }
      />

      {/* Error banner */}
      {startMutation.isError && (
        <div
          role="alert"
          style={{
            margin: '12px 24px 0',
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--co-btn-r)',
            fontSize: 13,
            color: 'var(--co-red)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Icon.AlertCircle size={14} />
          開始直播失敗，請稍後再試。（後端 API 尚未上線）
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
        <div
          className="live-host-layout"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Left column */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LiveVideoArea />
            <ControlBar
              isLive={isLive}
              viewerCount={viewerCount}
              isPending={startMutation.isPending}
              onStart={() => startMutation.mutate()}
              onStop={() => stopMutation.mutate()}
            />
          </div>

          {/* Right column: settings */}
          <div style={{ flexShrink: 0 }}>
            <StreamSettingsPanel
              title={title}
              onTitleChange={setTitle}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              language={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .live-host-layout {
            flex-direction: row !important;
            align-items: flex-start;
          }
          .live-host-layout > div:last-child {
            width: 320px;
          }
        }
      `}</style>
    </div>
  );
}
