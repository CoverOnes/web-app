/**
 * DiscoverPage — 探索企業
 *
 * Design reference: design-reference/chat/project/Discover.html
 *
 * Data source decision-A: No backend company/discover API exists yet.
 * The page renders empty-state ("尚無資料") per the no-frontend-fake-data rule.
 * A backend company directory API is needed (GET /api/company/v1/discover or similar)
 * before real data can be displayed.
 *
 * The filter bar, right-rail industry list, and geography distribution panels
 * are rendered as interactive UI shells with empty-states in their content areas.
 * All colours use var(--co-*) tokens defined in src/index.css.
 *
 * RWD:
 *   ≥768px: two-column layout (grid 3-col + right rail 320px), filter bar visible
 *   <768px: single-column, filter chips horizontally scrollable, right rail stacks below
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterChip } from '../components/ui/FilterChip';

/* ── Design-system colour constants via --co-* tokens ── */
const P = {
  textIndigoLt: 'var(--co-indigo-lt)',
  gradBlue:     'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
  gradCyan:     'linear-gradient(135deg, var(--co-sky), var(--co-cyan))',
  gradAmber:    'linear-gradient(135deg, var(--co-amber), var(--co-orange))',
  gradGreen:    'linear-gradient(135deg, var(--co-green), var(--co-green-dk))',
  gradRose:     'linear-gradient(135deg, var(--co-amber), var(--co-red))',
  gradPurple:   'linear-gradient(135deg, var(--co-pink), var(--co-accent-2))',
} as const;

/* ── Filter definitions ── */
type ActiveFilter = { id: string; label: string; value: string };

const INDUSTRY_FILTERS: ActiveFilter[] = [
  { id: 'industry', label: '產業', value: '科技 / AI' },
  { id: 'region',   label: '地區', value: '大台北' },
];

const PASSIVE_CHIPS = ['公司規模 ▾', '資本額 ▾', '已認證 ✓', '最近活躍 ▾'];

/* ── Industry list (right-rail static — no API required, pure UI) ── */
interface IndustryItem {
  icon: string;
  name: string;
  count: string;
  iconBg: string;
  iconColor: string;
}

const INDUSTRY_LIST: IndustryItem[] = [
  { icon: '🤖', name: 'AI / 機器學習',  count: '—', iconBg: 'var(--co-bdg-dev-bg)',    iconColor: 'var(--co-bdg-dev-text)'    },
  { icon: '💎', name: '半導體',         count: '—', iconBg: 'var(--co-bdg-design-bg)', iconColor: 'var(--co-bdg-design-text)' },
  { icon: '🏦', name: '金融科技',       count: '—', iconBg: 'var(--co-bdg-green-bg)',  iconColor: 'var(--co-bdg-green-text)'  },
  { icon: '🏭', name: '智慧製造',       count: '—', iconBg: 'var(--co-bdg-mfg-bg)',    iconColor: 'var(--co-bdg-mfg-text)'    },
  { icon: '🛍️', name: '零售 / 電商',   count: '—', iconBg: 'var(--co-bdg-mkt-bg)',    iconColor: 'var(--co-bdg-mkt-text)'    },
  { icon: '🎨', name: '創意 / 設計',   count: '—', iconBg: 'var(--co-bdg-violet-bg)', iconColor: 'var(--co-bdg-violet-text)' },
];

/* ── Geography list (right-rail static) ──
   barPct: 0 — honest empty-state until the backend company/discover API ships.
   Counts show "—" so no fake ranking is implied. */
interface GeoItem {
  name: string;
  dotColor: string;
  barColor: string;
  barPct: number;
}

const GEO_LIST: GeoItem[] = [
  { name: '大台北',        dotColor: 'var(--co-accent)',  barColor: 'linear-gradient(90deg, var(--co-accent), var(--co-cyan))',                    barPct: 0 },
  { name: '新竹科技園區',  dotColor: 'var(--co-cyan)',    barColor: 'linear-gradient(90deg, var(--co-cyan), var(--co-bdg-design-text))',            barPct: 0 },
  { name: '台中',          dotColor: 'var(--co-green)',   barColor: 'linear-gradient(90deg, var(--co-green), var(--co-bdg-green-text))',            barPct: 0 },
  { name: '高雄',          dotColor: 'var(--co-amber)',   barColor: 'linear-gradient(90deg, var(--co-amber), var(--co-bdg-mfg-text))',              barPct: 0 },
  { name: '台南',          dotColor: 'var(--co-pink)',    barColor: 'linear-gradient(90deg, var(--co-pink), var(--co-bdg-mkt-text))',               barPct: 0 },
];

/* ── Sort icon (filter-bar) ── */
const SortIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M3 6h18M6 12h12M10 18h4" />
  </svg>
);

/* ── Grid icon ── */
const GridIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

/* ── Building empty-state icon ── */
const BuildingIcon = () => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-4h6v4" />
    <path d="M9 10h1m4 0h1M9 14h1m4 0h1" />
  </svg>
);

/* ════════════════════════════════════════════════════════════════════════════
   DiscoverPage component
   ════════════════════════════════════════════════════════════════════════════ */

export default function DiscoverPage() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INDUSTRY_FILTERS);
  const navigate = useNavigate();

  const removeFilter = (id: string) =>
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));

  return (
    <main
      aria-label="探索企業"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--co-bg)' }}
    >
      {/* ── Page header (shared.css .page-head) ── */}
      <div
        style={{
          padding: '24px 28px 18px 28px',
          borderBottom: '1px solid var(--co-line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--co-text-muted)', marginBottom: 6 }}>
              主選單 / 探索企業
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
                color: 'var(--co-text)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              探索企業
              <span style={{ fontSize: 16, color: 'var(--co-text-dim)', fontWeight: 500 }}>
                認證企業
              </span>
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: 0 }}>
              發掘潛在合作夥伴 · 根據你的產業偏好排序
            </p>
          </div>

          {/* Head actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              aria-label="排序選項"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--co-bg-3)', border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text)', cursor: 'pointer',
              }}
            >
              <SortIcon />
              排序：相關度
            </button>
            <button
              type="button"
              aria-label="切換網格檢視"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--co-bg-3)', border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text)', cursor: 'pointer',
              }}
            >
              <GridIcon />
              網格
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter bar (shared.css .filter-bar) ── */}
      <div
        role="search"
        aria-label="篩選條件"
        style={{
          display: 'flex',
          gap: 8,
          padding: '14px 28px',
          borderBottom: '1px solid var(--co-line)',
          flexWrap: 'wrap',
          alignItems: 'center',
          overflowX: 'auto',
        }}
      >
        {/* Active removable filters */}
        {activeFilters.map((f) => (
          <FilterChip
            key={f.id}
            label={`${f.label}：${f.value}`}
            active
            onRemove={() => removeFilter(f.id)}
          />
        ))}

        {/* Passive dropdown-style chips */}
        {PASSIVE_CHIPS.map((chip) => (
          <FilterChip key={chip} label={chip} />
        ))}

        {/* Result count — right-aligned */}
        <div
          aria-live="polite"
          style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--co-text-muted)', whiteSpace: 'nowrap' }}
        >
          {/* No API yet — show em-dash placeholder */}
          找到 <b style={{ color: 'var(--co-text)' }}>—</b> 家符合條件
        </div>
      </div>

      {/* ── Body: 2-column layout (shared.css .body) ── */}
      <div className="discover-body">

        {/* ── Left: company grid + empty-state ── */}
        <div className="discover-left">

          {/* Company grid empty-state — no backend API yet */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="企業清單"
          >
            <EmptyState
              icon={<BuildingIcon />}
              title="尚無企業資料"
              description="企業探索功能需要後端 company directory API 支援，目前尚未提供。後端 API 上線後，此處將顯示企業卡片網格、篩選及媒合評分。"
            />
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside className="discover-right" aria-label="探索輔助資訊">

          {/* Hot industries card */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 14, fontWeight: 600, marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              熱門產業
              <span style={{ fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>本週</span>
            </div>
            {INDUSTRY_LIST.map((item, i) => (
              <div
                key={item.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: i < INDUSTRY_LIST.length - 1 ? '1px solid var(--co-line)' : 'none',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                    background: item.iconBg, color: item.iconColor,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>{item.count}</div>
              </div>
            ))}
          </div>

          {/* Geography distribution card */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>企業地理分布</div>
            {GEO_LIST.map((geo, i) => (
              <div key={geo.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12.5 }}>
                  <span
                    aria-hidden="true"
                    style={{ width: 8, height: 8, borderRadius: 999, background: geo.dotColor, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{geo.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--co-text-dim)', fontWeight: 600 }}>—</span>
                </div>
                {/* Bar track — empty (barPct: 0) until backend API ships */}
                <div
                  aria-hidden="true"
                  style={{
                    height: 6, borderRadius: 999,
                    background: 'var(--co-line)',
                    overflow: 'hidden',
                    marginBottom: i < GEO_LIST.length - 1 ? 8 : 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block', height: '100%', borderRadius: 999,
                      background: geo.barColor,
                      width: `${geo.barPct}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Profile-completion suggestion card */}
          <div
            style={{
              background: `linear-gradient(135deg, var(--co-suggest-bg-from), var(--co-suggest-bg-to))`,
              border: '1px solid var(--co-suggest-border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>為你建議</div>
            <div style={{ fontSize: 12, color: 'var(--co-text-dim)', lineHeight: 1.5, marginBottom: 12 }}>
              完成公司簡介可以讓你的曝光率提升 3 倍，更容易被企業搜尋到。
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: P.gradBlue,
                color: 'var(--co-text-on-accent)',
                border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 12px var(--co-suggest-shadow)`,
              }}
            >
              完善公司檔案 →
            </button>
          </div>
        </aside>
      </div>

      {/* ── Inline scoped styles (RWD breakpoints + layout) ── */}
      <style>{`
        .discover-body {
          padding: 24px 28px 40px 28px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
          box-sizing: border-box;
        }
        .discover-left {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        .discover-right {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        @media (max-width: 767px) {
          .discover-body {
            grid-template-columns: 1fr;
            padding: 16px 16px 40px 16px;
            gap: 16px;
          }
        }
      `}</style>
    </main>
  );
}
