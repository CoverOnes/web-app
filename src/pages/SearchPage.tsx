/**
 * SearchPage — full-site search over real listings + empty-state for unbacked tabs.
 *
 * Tabs:
 *   - 案件 (listings): real data via marketplaceApi.listListings() + client-side q filter
 *   - 公司: EMPTY STATE — no company directory API exists yet (FLAG: needs backend)
 *   - 人才: EMPTY STATE — no user-directory API exists yet (FLAG: needs backend)
 *
 * URL: /search?q=<query>
 * The topbar search input navigates to /search?q=<query>; this page reads q from URL.
 */

import { useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useListings } from '../lib/query';
import type { Listing } from '../lib/api/coverones';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Icon } from '../components/ui/Icon';
import { formatDistanceToNow } from 'date-fns';

/* ── Design token constants (all from index.css :root / shared.css) ─────── */
const P = {
  accent:       'var(--co-accent)',
  accent2:      'var(--co-accent-2)',
  cyan:         'var(--co-cyan)',
  green:        'var(--co-green)',
  amber:        'var(--co-amber)',
  textViolet:   'var(--co-bdg-dev-text)',    /* #A78BFA */
  textCyan:     'var(--co-bdg-design-text)',  /* #67E8F9 */
  textIndigoLt: '#C7D2FE',
  textAmberLt:  'var(--co-bdg-mfg-text)',    /* #FCD34D */
  textGreenLt:  '#6EE7B7',
  textGreen:    'var(--co-green)',
  highlight:    'rgba(252,211,77,0.18)',
  highlightText:'#FCD34D',
} as const;

/* ── Tab definition ─────────────────────────────────────────────────────── */
type TabId = 'listings' | 'companies' | 'people';

interface TabDef {
  id: TabId;
  label: string;
  /** null = count not yet loaded; undefined = tab is unbacked */
  count?: number | null;
}

/* ── Role badge ─────────────────────────────────────────────────────────── */
type BadgeVariant = 'dev' | 'design' | 'mfg' | 'mkt' | 'grey' | 'cyan' | 'amber' | 'green';

interface RoleBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

function RoleBadge({ variant, children }: RoleBadgeProps) {
  const s: Record<BadgeVariant, React.CSSProperties> = {
    dev:    { background: 'var(--co-bdg-dev-bg)',    color: 'var(--co-bdg-dev-text)',    border: '1px solid var(--co-bdg-dev-border)' },
    design: { background: 'var(--co-bdg-design-bg)', color: 'var(--co-bdg-design-text)', border: '1px solid var(--co-bdg-design-border)' },
    mfg:    { background: 'var(--co-bdg-mfg-bg)',    color: 'var(--co-bdg-mfg-text)',    border: '1px solid var(--co-bdg-mfg-border)' },
    mkt:    { background: 'var(--co-bdg-mkt-bg)',    color: 'var(--co-bdg-mkt-text)',    border: '1px solid var(--co-bdg-mkt-border)' },
    grey:   { background: 'rgba(148,163,184,0.10)',  color: 'var(--co-text-dim)',         border: '1px solid rgba(148,163,184,0.20)' },
    cyan:   { background: 'rgba(34,211,238,0.12)',   color: P.textCyan,                   border: '1px solid rgba(34,211,238,0.30)' },
    amber:  { background: 'rgba(245,158,11,0.15)',   color: P.textAmberLt,               border: '1px solid rgba(245,158,11,0.35)' },
    green:  { background: 'rgba(16,185,129,0.12)',   color: P.textGreenLt,               border: '1px solid rgba(16,185,129,0.30)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 500,
      ...s[variant],
    }}>
      {children}
    </span>
  );
}

/* ── Logo square (deterministic gradient from id) ───────────────────────── */
const LOGO_GRADS = [
  'linear-gradient(135deg,#2563EB,#6366F1)',
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#EC4899,#8B5CF6)',
  'linear-gradient(135deg,#F59E0B,#F97316)',
  'linear-gradient(135deg,#0EA5E9,#22D3EE)',
];
function logoGrad(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_GRADS[Math.abs(h) % LOGO_GRADS.length];
}

/* ── Highlighted text ───────────────────────────────────────────────────── */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <em style={{
        background: P.highlight, color: P.highlightText,
        fontStyle: 'normal', padding: '1px 4px', borderRadius: 3, fontWeight: 700,
      }}>
        {text.slice(idx, idx + query.length)}
      </em>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ── Listing result card (real data from API) ───────────────────────────── */
function ListingCard({ listing, query }: { listing: Listing; query: string }) {
  const navigate = useNavigate();

  const budgetLabel = (() => {
    if (listing.budgetMin && listing.budgetMax)
      return `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`;
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `Up to ${listing.currency} ${listing.budgetMax}`;
    return null;
  })();

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }); }
    catch { return ''; }
  })();

  const letter = listing.title.charAt(0).toUpperCase();
  const grad = logoGrad(listing.id);

  return (
    <div
      role="article"
      aria-label={listing.title}
      onClick={() => navigate(`/jobs/${listing.id}`)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--co-line-strong)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--co-bg-card)';
      }}
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 11,
        padding: '14px 16px',
        marginBottom: 10,
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 13,
        alignItems: 'flex-start',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      {/* Logo */}
      <div
        aria-hidden="true"
        style={{
          width: 44, height: 44, borderRadius: 8,
          background: grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0,
        }}
      >
        {letter}
      </div>

      {/* Content */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
          <Highlighted text={listing.title} query={query} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', display: 'flex', gap: 9, marginTop: 5, flexWrap: 'wrap' }}>
          {timeAgo && <span>{timeAgo}</span>}
          {budgetLabel && (
            <>
              <span>·</span>
              <span style={{ color: P.cyan, fontWeight: 500 }}>{budgetLabel}</span>
            </>
          )}
          <span>·</span>
          <RoleBadge variant={listing.status === 'OPEN' ? 'green' : 'grey'}>
            {listing.status === 'OPEN' ? '開放中' : listing.status === 'AWARDED' ? '已得標' : '已關閉'}
          </RoleBadge>
        </div>
        {listing.description && (
          <div style={{
            fontSize: 11.5, color: 'var(--co-text-dim)', marginTop: 9, lineHeight: 1.55,
            background: 'rgba(15,23,42,0.5)', border: '1px solid var(--co-line)',
            borderRadius: 8, padding: '9px 11px',
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            <Highlighted text={listing.description} query={query} />
          </div>
        )}
      </div>

      {/* Right meta */}
      <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11.5, color: 'var(--co-text-muted)' }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${listing.id}`); }}
          aria-label={`查看 ${listing.title} 詳情`}
          style={{
            padding: '7px 14px', fontSize: 12, fontWeight: 600,
            background: 'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent-2))',
            color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(99,102,241,0.25)',
            marginTop: 4,
          }}
        >
          查看詳情 →
        </button>
      </div>
    </div>
  );
}

/* ── Filter sidebar ─────────────────────────────────────────────────────── */
interface FilterState {
  status: Set<string>;
}

function defaultFilters(): FilterState {
  return { status: new Set(['OPEN']) };
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  function toggleStatus(v: string) {
    const next = new Set(filters.status);
    if (next.has(v)) next.delete(v); else next.add(v);
    onFiltersChange({ ...filters, status: next });
  }

  const statusOptions = [
    { value: 'OPEN',    label: '開放中' },
    { value: 'AWARDED', label: '已得標' },
    { value: 'CLOSED',  label: '已關閉' },
  ];

  return (
    <aside
      aria-label="篩選條件"
      style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80, alignSelf: 'flex-start' }}
    >
      <div style={{
        background: 'var(--co-bg-card)', border: '1px solid var(--co-line-strong)',
        borderRadius: 11, padding: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--co-text-muted)', marginBottom: 10 }}>
          案件狀態
        </div>
        {statusOptions.map(({ value, label }) => (
          <label
            key={value}
            style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, padding: '5px 0', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={filters.status.has(value)}
              onChange={() => toggleStatus(value)}
              style={{ width: 14, height: 14, accentColor: 'var(--co-accent)' }}
            />
            {label}
          </label>
        ))}
      </div>
    </aside>
  );
}

/* ── Mobile filter sheet (bottom sheet) ─────────────────────────────────── */
interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

function MobileFilterSheet({ open, onClose, filters, onFiltersChange }: MobileFilterSheetProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="篩選條件"
      style={{ position: 'fixed', inset: 0, zIndex: 400 }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--co-bg-card)', borderRadius: '16px 16px 0 0',
        padding: '20px 20px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        animation: 'slideIn 200ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>篩選條件</span>
          <button
            onClick={onClose}
            aria-label="關閉篩選"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--co-text-dim)', padding: 4 }}
          >
            <Icon.X size={20} />
          </button>
        </div>
        <FilterSidebar filters={filters} onFiltersChange={onFiltersChange} />
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 20, padding: '12px 0',
            background: 'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent-2))',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          套用篩選
        </button>
      </div>
    </div>
  );
}

/* ── Pagination ─────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10;

interface PaginationProps {
  total: number;
  page: number;
  onPage: (p: number) => void;
}

function Pagination({ total, page, onPage }: PaginationProps) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, fontSize: 13, color: 'var(--co-text-dim)' }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="上一頁"
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12,
          background: page <= 1 ? 'rgba(148,163,184,0.06)' : 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          color: page <= 1 ? 'var(--co-text-muted)' : 'var(--co-text-dim)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        ← 上一頁
      </button>
      <span>第 {page} / {totalPages} 頁</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="下一頁"
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12,
          background: page >= totalPages ? 'rgba(148,163,184,0.06)' : 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          color: page >= totalPages ? 'var(--co-text-muted)' : 'var(--co-text-dim)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        下一頁 →
      </button>
    </div>
  );
}

/* ── Related search pills ───────────────────────────────────────────────── */
const RELATED_QUERIES = ['AI 開發', '數位轉型', '前端工程師', 'Python 爬蟲', '行銷顧問', '品牌設計'];

/* ── Main SearchPage component ──────────────────────────────────────────── */
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const [activeTab, setActiveTab] = useState<TabId>('listings');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch ALL listings; client-side filter by q + status
  const { data: allListings, isLoading, isError } = useListings({ status: undefined });

  // Client-side filter: match q against title + description, then status filter
  const filteredListings: Listing[] = (() => {
    if (!allListings) return [];
    return allListings.filter((l) => {
      // Status filter
      if (filters.status.size > 0 && !filters.status.has(l.status)) return false;
      // Text search (if q provided)
      if (!q.trim()) return true;
      const haystack = `${l.title} ${l.description}`.toLowerCase();
      return q.toLowerCase().split(/\s+/).every((token) => haystack.includes(token));
    });
  })();

  // Paginate
  const paginatedListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const listingsCount = filteredListings.length;

  // Tab definitions — companies and people have no API yet
  const tabs: TabDef[] = [
    { id: 'listings',  label: '案件',  count: isLoading ? null : listingsCount },
    { id: 'companies', label: '公司',  count: undefined }, // no API
    { id: 'people',    label: '人才',  count: undefined }, // no API
  ];

  const handleSearch = useCallback((value: string) => {
    setSearchParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
    setPage(1);
  }, [setSearchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    handleSearch('');
    inputRef.current?.focus();
  };

  const handleRelatedQuery = (rq: string) => {
    setInputValue(rq);
    handleSearch(rq);
  };

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setPage(1);
  };

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setPage(1);
  };

  return (
    <div
      className="search-page-root"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--co-bg)', color: 'var(--co-text)' }}
    >

      {/* ── Search hero ── */}
      <div style={{
        padding: '30px 28px 18px',
        background: 'linear-gradient(180deg,rgba(99,102,241,0.08),transparent)',
        borderBottom: '1px solid var(--co-line)',
      }}>
        <form onSubmit={handleSubmit} role="search" aria-label="全站搜尋">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
            background: 'var(--co-bg-card)',
            border: '1.5px solid rgba(99,102,241,0.4)', borderRadius: 14,
            boxShadow: '0 0 0 5px rgba(99,102,241,0.08)', maxWidth: 880,
          }}>
            <Icon.Search size={22} style={{ color: '#A78BFA', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="搜尋案件、公司、人才…"
              aria-label="搜尋關鍵字"
              style={{
                flex: 1, background: 'transparent', fontSize: 18, color: 'var(--co-text)',
                outline: 'none', border: 'none',
              }}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="清除搜尋"
                style={{
                  width: 26, height: 26, borderRadius: 6, background: 'var(--co-bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--co-text-dim)', fontSize: 14, cursor: 'pointer', border: 'none', flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              aria-label="執行搜尋"
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))',
                borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              搜尋
            </button>
          </div>
        </form>

        {/* Meta line */}
        {q && (
          <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', marginTop: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>
              搜尋「<strong style={{ color: 'var(--co-text)' }}>{q}</strong>」
              {!isLoading && <> · 案件共 <strong style={{ color: 'var(--co-text)' }}>{listingsCount}</strong> 筆</>}
            </span>
            <span style={{
              padding: '3px 9px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 5, color: P.textIndigoLt, fontWeight: 600, fontSize: 11,
            }}>
              ⚡ 關鍵字搜尋
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        role="tablist"
        aria-label="搜尋類別"
        style={{
          padding: '0 28px', borderBottom: '1px solid var(--co-line)',
          display: 'flex', gap: 0, background: 'var(--co-bg-2)',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`search-panel-${tab.id}`}
              id={`search-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '13px 18px', fontSize: 13,
                color: isActive ? 'var(--co-text)' : 'var(--co-text-dim)',
                borderBottom: isActive ? '2px solid var(--co-accent)' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
                background: 'none', border: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 7, marginBottom: -1,
                transition: 'color 150ms',
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 11, padding: '1px 7px', borderRadius: 999,
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.12)',
                  color: isActive ? P.textIndigoLt : 'var(--co-text-dim)',
                  fontWeight: 500,
                }}>
                  {tab.count === null ? '…' : tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Mobile filter trigger */}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setMobileFilterOpen(true)}
          aria-label="開啟篩選"
          className="search-filter-trigger"
          style={{
            display: 'none',
            alignItems: 'center', gap: 6, padding: '13px 14px', fontSize: 13,
            color: 'var(--co-text-dim)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <Icon.Settings size={14} />
          篩選
        </button>
      </div>

      {/* ── Body (3-column on desktop) ── */}
      <div
        className="search-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0,1fr) 300px',
          gap: 22, padding: '22px 28px 40px', flex: 1,
        }}
      >

        {/* ── Left filter sidebar (desktop only) ── */}
        <div className="search-filters-col">
          <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* ── Center: results ── */}
        <div
          role="tabpanel"
          id={`search-panel-${activeTab}`}
          aria-labelledby={`search-tab-${activeTab}`}
        >
          {/* ── 案件 tab (real data) ── */}
          {activeTab === 'listings' && (
            <>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <LoadingSkeleton count={5} height="h-28" />
                </div>
              ) : isError ? (
                <EmptyState
                  icon={<Icon.X size={48} />}
                  title="載入失敗"
                  description="請重新整理頁面。"
                />
              ) : filteredListings.length === 0 ? (
                <EmptyState
                  icon={<Icon.Search size={48} />}
                  title={q ? `找不到符合「${q}」的案件` : '目前沒有案件'}
                  description={q ? '請嘗試其他關鍵字，或取消篩選條件。' : '目前案件市場暫無資料，稍後再試。'}
                />
              ) : (
                <>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'rgba(34,211,238,0.18)', color: '#67E8F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="6" width="18" height="14" rx="2" />
                        <path d="M8 6V4h8v2" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>案件</span>
                    <span style={{ fontSize: 11.5, color: 'var(--co-text-muted)' }}>{listingsCount} 筆</span>
                  </div>

                  {paginatedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} query={q} />
                  ))}

                  <Pagination total={filteredListings.length} page={page} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                </>
              )}
            </>
          )}

          {/* ── 公司 tab (empty-state — no API) ── */}
          {activeTab === 'companies' && (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                </svg>
              }
              title="尚無公司搜尋來源"
              description="公司目錄搜尋功能正在開發中，敬請期待。此功能需要後端 company directory API 支援。"
            />
          )}

          {/* ── 人才 tab (empty-state — no API) ── */}
          {activeTab === 'people' && (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="9" cy="8" r="4" />
                  <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
              }
              title="尚無人才搜尋來源"
              description="人才目錄搜尋功能正在開發中，敬請期待。此功能需要後端 user directory API 支援。"
            />
          )}
        </div>

        {/* ── Right rail ── */}
        <aside className="search-right-col" aria-label="相關資訊">

          {/* Related searches */}
          <div style={{
            background: 'var(--co-bg-card)', border: '1px solid var(--co-line-strong)',
            borderRadius: 12, padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--co-text-muted)', marginBottom: 11 }}>
              相關搜尋
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {RELATED_QUERIES.map((rq) => (
                <button
                  key={rq}
                  onClick={() => handleRelatedQuery(rq)}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 999, fontSize: 11.5, color: P.textIndigoLt, cursor: 'pointer',
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.5)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.25)'; }}
                >
                  {rq}
                </button>
              ))}
            </div>
          </div>

          {/* Missing API flags — transparent to users, useful for devs */}
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--co-text-muted)', marginBottom: 11 }}>
              功能開發中
            </div>
            <div style={{ fontSize: 12, color: 'var(--co-text-dim)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ color: P.amber, flexShrink: 0 }}>⚠</span>
                <span><strong style={{ color: 'var(--co-text)' }}>公司搜尋</strong>：需後端 company directory API</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: P.amber, flexShrink: 0 }}>⚠</span>
                <span><strong style={{ color: 'var(--co-text)' }}>人才搜尋</strong>：需後端 user directory API</span>
              </div>
            </div>
          </div>

        </aside>

      </div>

      {/* ── Mobile filter bottom sheet ── */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* ── RWD styles ── */}
      <style>{`
        /* Tablet: hide right rail, 2-column */
        @media (max-width: 1279px) {
          .search-body {
            grid-template-columns: 200px minmax(0,1fr) !important;
          }
          .search-right-col { display: none !important; }
        }
        /* Mobile: single column, hide sidebar, show filter trigger */
        @media (max-width: 767px) {
          .search-body {
            grid-template-columns: 1fr !important;
            padding: 16px 16px 80px 16px !important;
          }
          .search-filters-col { display: none !important; }
          .search-right-col   { display: none !important; }
          .search-filter-trigger { display: flex !important; }
          /* Hero padding */
          .search-page-root > div:first-child {
            padding: 18px 16px 14px !important;
          }
          /* Tabs */
          .search-page-root [role="tablist"] {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
