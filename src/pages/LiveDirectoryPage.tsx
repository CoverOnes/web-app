/**
 * LiveDirectoryPage — /live
 *
 * Browsable grid of live-stream cards.
 * Data: getLiveStreams() → returns [] until backend ships (typed stub in api/live.ts).
 * Renders EmptyState while empty, LoadingSkeleton while loading.
 *
 * Layout:
 *   PageHead (title + 開始直播 button)
 *   Tabs row (推薦 / 全部直播台)
 *   Filter bar (sort select + language/tag FilterChips)
 *   Responsive grid repeat(auto-fill, minmax(280px, 1fr))
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLiveStreams } from '../api/live';
import { PageHead } from '../components/layout/PageHead';
import { LiveStreamCard } from '../components/live/LiveStreamCard';
import { Icon } from '../components/ui/Icon';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'recommended' | 'all';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'recommended', label: '推薦' },
  { id: 'all', label: '全部直播台' },
];

// ─── Filter chips ─────────────────────────────────────────────────────────────

const TAG_CHIPS = ['AI', '商業', '科技', '教育', '設計', '行銷'];
const LANGUAGE_CHIPS = ['繁體中文', 'English', '日本語'];

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line)',
        borderRadius: 'var(--co-card-r)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          background:
            'linear-gradient(90deg, var(--co-bg-card) 25%, var(--co-bg-card-2) 50%, var(--co-bg-card) 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.6s linear infinite',
        }}
      />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--co-bg-card-2)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 13, borderRadius: 4, background: 'var(--co-bg-card-2)', width: '80%' }} />
            <div style={{ height: 11, borderRadius: 4, background: 'var(--co-bg-card-2)', width: '50%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        gap: 14,
        textAlign: 'center',
      }}
    >
      <Icon.Video size={48} style={{ color: 'var(--co-text-muted)', opacity: 0.35 }} />
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--co-text)',
          margin: 0,
        }}
      >
        目前沒有直播台上線
      </p>
      <p style={{ fontSize: 13, color: 'var(--co-text-muted)', margin: 0 }}>
        稍後再來看看，或開始你自己的直播。
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveDirectoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [sortValue, setSortValue] = useState('popular');
  const [activeTagChips, setActiveTagChips] = useState<string[]>([]);
  const [activeLangChips, setActiveLangChips] = useState<string[]>([]);

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ['liveStreams'],
    queryFn: getLiveStreams,
    staleTime: 30_000,
  });

  const toggleChip = (list: string[], setList: (v: string[]) => void, chip: string) => {
    setList(list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page head */}
      <PageHead
        crumb="主選單 / 替身直播"
        title="替身直播台"
        actions={
          <button
            type="button"
            onClick={() => navigate('/live/host')}
            style={{
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--co-btn-r)',
              background: 'linear-gradient(90deg, var(--co-btn-primary-from), var(--co-btn-primary-to))',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'opacity 150ms',
              minHeight: 44,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Icon.Video size={14} />
            開始直播
          </button>
        }
      />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 32px' }}>
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="直播台分類"
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--co-line)',
            marginBottom: 16,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`live-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`live-tabpanel-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--co-accent)' : '2px solid transparent',
                  borderRadius: 0,
                  background: 'transparent',
                  color: isActive ? 'var(--co-accent)' : 'var(--co-text-dim)',
                  cursor: 'pointer',
                  transition: 'color 150ms',
                  marginBottom: -1,
                  height: 'var(--co-tab-h)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div
          role="region"
          aria-label="篩選條件"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          {/* Sort */}
          <select
            aria-label="排序方式"
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            style={{
              fontSize: 12,
              padding: '5px 10px',
              background: 'var(--co-bg-3)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-badge-r)',
              color: 'var(--co-text)',
              cursor: 'pointer',
            }}
          >
            <option value="popular">最多觀眾</option>
            <option value="recent">最新開播</option>
          </select>

          {/* Separator */}
          <span aria-hidden="true" style={{ height: 16, width: 1, background: 'var(--co-line-strong)' }} />

          {/* Language chips */}
          {LANGUAGE_CHIPS.map((chip) => {
            const active = activeLangChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={active}
                onClick={() => toggleChip(activeLangChips, setActiveLangChips, chip)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 'var(--co-badge-r)',
                  border: active ? '1px solid var(--co-accent)' : '1px solid var(--co-line-strong)',
                  background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: active ? 'var(--co-indigo-200)' : 'var(--co-text-dim)',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
              >
                {chip}
              </button>
            );
          })}

          <span aria-hidden="true" style={{ height: 16, width: 1, background: 'var(--co-line-strong)' }} />

          {/* Tag chips */}
          {TAG_CHIPS.map((chip) => {
            const active = activeTagChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={active}
                onClick={() => toggleChip(activeTagChips, setActiveTagChips, chip)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 'var(--co-badge-r)',
                  border: active ? '1px solid var(--co-accent)' : '1px solid var(--co-line-strong)',
                  background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: active ? 'var(--co-indigo-200)' : 'var(--co-text-dim)',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          role="tabpanel"
          id={`live-tabpanel-${activeTab}`}
          aria-labelledby={`live-tab-${activeTab}`}
        >
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : streams.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {streams.map((stream) => (
                <LiveStreamCard key={stream.roomId} stream={stream} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
