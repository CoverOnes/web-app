/**
 * SavedPage — 收藏夾 (P4 Saved vertical, frontend half)
 *
 * Design reference: design-reference/chat/project/Saved.html
 *
 * ── Data-source decision (zero fake data) ──────────────────────────────────────
 * Wired to the REAL saved API (GET/POST/DELETE /api/user/v1/me/saved). Every
 * rendered string/number derives from a live saved row + (for jobs) the hydrated
 * marketplace Listing, or is a static label / empty-state. NOTHING is fabricated.
 *
 * LIVE (real data):
 *   - Page head + subtitle 共 <jobsCount + companiesCount> 個收藏 (derived live)
 *   - 2 tabs: 儲存的案件 (saved jobs) / 追蹤的公司 (followed companies) with live counts
 *   - Job cards: each saved JOB ref is hydrated via useListing(itemId) inside
 *     <SavedJobCard> (one hook per card → rules-of-hooks compliant). A job that
 *     404s on getListing renders nothing (resolve-on-read skip).
 *   - Company cards: rendered directly from the in-service PII-safe projection.
 *   - Star ★ = optimistic unsave w/ revert-on-error (useToggleSaved).
 *   - Empty states per tab with a real CTA (→/jobs, →/discover).
 *
 * DEFER (omitted — Saved.html showed these but no backend supports them, so we
 * render NOTHING fabricated):
 *   - Left collections sidebar (收藏夾/分類/自訂列表/最近瀏覽 counts 18/7/6/3/2/42)
 *   - 人脈 / 文件 tabs · Smart AI banner · header pills (截止日近/有更新)
 *   - 匯出 CSV / 新增收藏夾 buttons · 排序下拉 · 卡片/列表 view toggle
 *   - Per-card 自訂列表 footer tag · star-rating / 連結度 / RFP 倒數 · 載入更多 paging
 *
 * Tokens only (var(--co-*)); translucent overlays use rgba(99,102,241,..) literals
 * (house precedent in NetworkPage). No raw hex. Attacker-controlled logoUrl is
 * hardened via httpsUrl(). All authed queries gate on auth-ready (in the hooks).
 *
 * RWD: grid 3-col ≥1024, 2-col 768–1023, 1-col <768 (mirrors Saved.html .grid).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useSavedJobs, useSavedCompanies, useToggleSaved, useListing } from '../lib/query';
import type { SavedJobRef, SavedCompany } from '../lib/api/coverones';
import { httpsUrl } from '../lib/url';

// ── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'job' | 'company';

// ── ISO → "N 天前" relative time (mirrors NotificationsPage's formatDistanceToNow
//    + zhTW; returns '' on a bad date so we never render "Invalid Date"). ────────
function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: zhTW });
  } catch {
    return '';
  }
}

// ── Listing budget → display price (only when at least one bound is present) ─────
function priceLabel(currency: string, min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  const cur = currency || 'NT$';
  if (min && max) return `${cur} ${min} – ${max}`;
  return `${cur} ${min ?? max}`;
}

// ── Listing status → zh chip label ──────────────────────────────────────────────
function statusLabel(status: 'OPEN' | 'AWARDED' | 'CLOSED'): string {
  switch (status) {
    case 'OPEN':
      return '開放中';
    case 'AWARDED':
      return '已媒合';
    case 'CLOSED':
      return '已結束';
  }
}

// ── Shared star button (optimistic unsave on the saved list) ─────────────────────
interface StarButtonProps {
  label: string; // accessible label, e.g. 取消儲存「<title>」
  pending: boolean;
  onToggle: () => void;
}
function StarButton({ label, pending, onToggle }: StarButtonProps) {
  return (
    <button
      type="button"
      className="sc-star"
      aria-label={label}
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation(); // don't trigger the card's navigate
        onToggle();
      }}
    >
      ★
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Saved JOB card — hydrates a bare ref via useListing(itemId). One hook per card
// keeps rules-of-hooks intact. A 404/gone listing renders nothing (skip).
// ════════════════════════════════════════════════════════════════════════════
interface SavedJobCardProps {
  ref_: SavedJobRef;
  onUnsave: (itemId: string) => void;
  togglePending: boolean;
}
function SavedJobCard({ ref_, onUnsave, togglePending }: SavedJobCardProps) {
  const navigate = useNavigate();
  const listingQuery = useListing(ref_.itemId);
  const listing = listingQuery.data;

  // Still loading → lightweight skeleton (no fabricated content).
  if (listingQuery.isLoading) {
    return <div className="save-card save-card--skel" aria-hidden="true" />;
  }
  // Gone / 404 / error → resolve-on-read skip (render nothing).
  if (listingQuery.isError || !listing) return null;

  const price = priceLabel(listing.currency, listing.budgetMin, listing.budgetMax);

  return (
    <div
      className="save-card"
      role="button"
      tabIndex={0}
      aria-label={`案件：${listing.title}`}
      onClick={() => navigate(`/jobs/${ref_.itemId}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/jobs/${ref_.itemId}`);
        }
      }}
    >
      <StarButton
        label={`取消儲存「${listing.title}」`}
        pending={togglePending}
        onToggle={() => onUnsave(ref_.itemId)}
      />
      <div className="sc-cover sc-cover--proj">
        <span className="sc-tag">🏷 案件</span>
      </div>
      <div className="sc-body">
        <div className="sc-ti">{listing.title}</div>
        <div className="sc-meta">
          <span>已發佈 {relativeTime(listing.createdAt)}</span>
        </div>
        {price && <div className="sc-price">{price}</div>}
        <div className="sc-badges">
          <span className={`sc-bdg sc-bdg--${listing.status === 'OPEN' ? 'green' : 'grey'}`}>
            {statusLabel(listing.status)}
          </span>
        </div>
      </div>
      <div className="sc-foot">
        <span className="sc-ago">🕘 {relativeTime(ref_.savedAt)}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Saved COMPANY card — rendered directly from the in-service PII-safe projection.
// ════════════════════════════════════════════════════════════════════════════
interface SavedCompanyCardProps {
  saved: SavedCompany;
  onUnsave: (itemId: string) => void;
  togglePending: boolean;
}
function SavedCompanyCard({ saved, onUnsave, togglePending }: SavedCompanyCardProps) {
  const navigate = useNavigate();
  const c = saved.company;
  const logo = httpsUrl(c.logoUrl);
  const initial = (c.name || '?').charAt(0).toUpperCase();
  // meta = only the fields actually present (industry · companySize).
  const metaParts = [c.industry, c.companySize].filter(Boolean) as string[];

  return (
    <div
      className="save-card"
      role="button"
      tabIndex={0}
      aria-label={`公司：${c.name}`}
      onClick={() => navigate(`/companies/${c.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/companies/${c.id}`);
        }
      }}
    >
      <StarButton
        label={`取消追蹤「${c.name}」`}
        pending={togglePending}
        onToggle={() => onUnsave(saved.itemId)}
      />
      <div className="sc-cover">
        <span className="sc-tag">🏢 公司</span>
        <div className="sc-logo">
          {logo ? <img src={logo} alt="" className="sc-logo-img" /> : initial}
        </div>
      </div>
      <div className="sc-body sc-body--company">
        <div className="sc-ti">{c.name}</div>
        {metaParts.length > 0 && (
          <div className="sc-meta">
            <span>{metaParts.join(' · ')}</span>
          </div>
        )}
        {c.tagline && <div className="sc-desc">{c.tagline}</div>}
        {c.location && (
          <div className="sc-badges">
            <span className="sc-bdg sc-bdg--grey">📍 {c.location}</span>
          </div>
        )}
      </div>
      <div className="sc-foot">
        <span className="sc-ago">🕘 {relativeTime(saved.savedAt)}</span>
      </div>
    </div>
  );
}

// ── Empty state (per tab) ────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  ctaLabel: string;
  onCta: () => void;
}
function EmptyState({ title, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="sv-empty" role="note">
      <div className="sv-empty-ic" aria-hidden="true">
        ★
      </div>
      <div className="sv-empty-t">{title}</div>
      <button type="button" className="sv-empty-cta" onClick={onCta}>
        {ctaLabel} →
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SavedPage
// ════════════════════════════════════════════════════════════════════════════
export default function SavedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('job');

  const jobsQuery = useSavedJobs();
  const companiesQuery = useSavedCompanies();

  const toggleJob = useToggleSaved('job');
  const toggleCompany = useToggleSaved('company');

  const jobs: SavedJobRef[] = jobsQuery.data?.items ?? [];
  const companies: SavedCompany[] = companiesQuery.data?.items ?? [];

  const jobsCount = jobs.length;
  const companiesCount = companies.length;
  const totalCount = jobsCount + companiesCount;

  // On the saved list the star always means "unsave" (currentlySaved=true).
  const handleUnsaveJob = (itemId: string) =>
    toggleJob.mutate({ itemId, currentlySaved: true });
  const handleUnsaveCompany = (itemId: string) =>
    toggleCompany.mutate({ itemId, currentlySaved: true });

  // A rejected toggle is reverted by the mutation's onError; surface a
  // non-blocking inline notice for the active tab.
  const toggleError =
    (activeTab === 'job' && toggleJob.isError) ||
    (activeTab === 'company' && toggleCompany.isError)
      ? '操作失敗，請稍後再試。'
      : null;

  const activeQuery = activeTab === 'job' ? jobsQuery : companiesQuery;

  return (
    <main aria-label="收藏夾" className="sv-page">
      {/* ── Page head (LIVE subtitle; CSV/新增收藏夾 DEFERRED) ── */}
      <div className="sv-head">
        <div className="sv-crumb">主選單 / 收藏夾</div>
        <h1 className="sv-title">收藏夾</h1>
        <p className="sv-desc">
          共 <b style={{ color: 'var(--co-text)' }}>{totalCount}</b> 個收藏 · 管理你儲存的案件與追蹤的公司
        </p>
      </div>

      {/* ── Tabs (LIVE counts; 人脈/文件 DEFERRED) ── */}
      <div className="sv-tabs" role="tablist" aria-label="收藏分類">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'job'}
          className={`sv-tab${activeTab === 'job' ? ' sv-tab--on' : ''}`}
          onClick={() => setActiveTab('job')}
        >
          儲存的案件 <span className="sv-tab-ct">{jobsCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'company'}
          className={`sv-tab${activeTab === 'company' ? ' sv-tab--on' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          追蹤的公司 <span className="sv-tab-ct">{companiesCount}</span>
        </button>
      </div>

      {/* ── Body ── */}
      <div className="sv-body">
        {toggleError && (
          <div role="alert" className="sv-error-inline">
            {toggleError}
          </div>
        )}

        {activeQuery.isError ? (
          <div role="alert" className="sv-error">
            無法載入收藏資料，請重新整理。
          </div>
        ) : activeQuery.isLoading ? (
          <div role="status" className="sv-loading">
            載入中…
          </div>
        ) : (
          <div role="tabpanel">
            {activeTab === 'job' &&
              (jobsCount === 0 ? (
                <EmptyState
                  title="尚未儲存任何案件"
                  ctaLabel="瀏覽案件看板"
                  onCta={() => navigate('/jobs')}
                />
              ) : (
                <div className="sv-grid">
                  {jobs.map((j) => (
                    <SavedJobCard
                      key={j.savedId}
                      ref_={j}
                      onUnsave={handleUnsaveJob}
                      togglePending={toggleJob.isPending && toggleJob.variables?.itemId === j.itemId}
                    />
                  ))}
                </div>
              ))}

            {activeTab === 'company' &&
              (companiesCount === 0 ? (
                <EmptyState
                  title="尚未追蹤任何公司"
                  ctaLabel="探索企業"
                  onCta={() => navigate('/discover')}
                />
              ) : (
                <div className="sv-grid">
                  {companies.map((c) => (
                    <SavedCompanyCard
                      key={c.savedId}
                      saved={c}
                      onUnsave={handleUnsaveCompany}
                      togglePending={toggleCompany.isPending && toggleCompany.variables?.itemId === c.itemId}
                    />
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Scoped styles (tokens only; RWD 768 + 1024) ── */}
      <style>{`
        .sv-page { display: flex; flex-direction: column; min-height: 100%; background: var(--co-bg); color: var(--co-text); }

        .sv-head { padding: 24px 28px 16px 28px; border-bottom: 1px solid var(--co-line); }
        .sv-crumb { font-size: 12px; color: var(--co-text-muted); margin-bottom: 6px; }
        .sv-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; color: var(--co-text); }
        .sv-desc { font-size: 13.5px; color: var(--co-text-dim); margin: 0; }

        .sv-tabs { display: flex; gap: 4px; padding: 12px 28px; border-bottom: 1px solid var(--co-line); overflow-x: auto; }
        .sv-tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: var(--co-text-dim); white-space: nowrap; }
        .sv-tab--on { background: rgba(99,102,241,0.18); color: var(--co-indigo-lt); }
        .sv-tab-ct { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--co-bg-3); color: var(--co-text-dim); font-weight: 600; }
        .sv-tab--on .sv-tab-ct { background: rgba(99,102,241,0.25); color: var(--co-indigo-lt); }

        .sv-body { padding: 22px 28px 40px 28px; max-width: 1280px; width: 100%; margin: 0 auto; box-sizing: border-box; }

        .sv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

        .save-card { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 13px; overflow: hidden; transition: transform 200ms, border-color 200ms, box-shadow 200ms; cursor: pointer; position: relative; }
        .save-card:hover { transform: translateY(-3px); border-color: rgba(99,102,241,0.4); box-shadow: 0 18px 40px rgba(0,0,0,0.4); }
        .save-card:focus-visible { outline: 2px solid var(--co-accent); outline-offset: 2px; }
        .save-card--skel { height: 200px; cursor: default; }
        .save-card--skel:hover { transform: none; border-color: var(--co-line-strong); box-shadow: none; }

        .sc-star { position: absolute; top: 11px; right: 11px; width: 30px; height: 30px; border-radius: 8px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: var(--co-amber); font-size: 14px; z-index: 2; border: none; cursor: pointer; }
        .sc-star:hover { background: rgba(0,0,0,0.7); }
        .sc-star:disabled { opacity: 0.5; cursor: not-allowed; }
        .sc-star:focus-visible { outline: 2px solid var(--co-accent); outline-offset: 2px; }

        .sc-cover { height: 90px; background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15)); position: relative; display: flex; align-items: center; justify-content: center; }
        .sc-cover--proj { background: linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.15)); }
        .sc-tag { position: absolute; top: 11px; left: 11px; padding: 3px 9px; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); border-radius: 5px; font-size: 10.5px; font-weight: 600; color: var(--co-text-on-accent); }
        .sc-logo { position: absolute; bottom: -18px; left: 18px; width: 50px; height: 50px; border-radius: 12px; border: 3px solid var(--co-bg-card); background: linear-gradient(135deg, var(--co-accent-blue), var(--co-accent)); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--co-text-on-accent); overflow: hidden; }
        .sc-logo-img { width: 100%; height: 100%; object-fit: cover; }

        .sc-body { padding: 24px 16px 14px; }
        .sc-body--company { padding-top: 28px; }
        .sc-ti { font-size: 14px; font-weight: 700; line-height: 1.4; color: var(--co-text); }
        .sc-meta { font-size: 11.5px; color: var(--co-text-dim); margin-top: 5px; display: flex; gap: 8px; flex-wrap: wrap; }
        .sc-desc { font-size: 12px; color: var(--co-text-dim); margin-top: 8px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-price { font-size: 15px; font-weight: 800; color: var(--co-green); font-feature-settings: "tnum"; margin-top: 6px; }
        .sc-badges { display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; }
        .sc-bdg { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 500; }
        .sc-bdg--green { background: var(--co-bdg-green-bg); color: var(--co-bdg-green-text); border: 1px solid var(--co-bdg-green-border); }
        .sc-bdg--grey { background: rgba(148,163,184,0.15); color: var(--co-text-dim); border: 1px solid var(--co-line-strong); }

        .sc-foot { padding: 10px 16px; border-top: 1px solid var(--co-line); display: flex; justify-content: flex-end; align-items: center; font-size: 11px; color: var(--co-text-muted); background: rgba(15,23,42,0.4); }
        .sc-ago { font-feature-settings: "tnum"; }

        .sv-empty { padding: 56px 24px; text-align: center; background: var(--co-bg-card); border: 1px dashed var(--co-line-strong); border-radius: 14px; }
        .sv-empty-ic { font-size: 32px; color: var(--co-amber); opacity: 0.5; margin-bottom: 14px; }
        .sv-empty-t { font-size: 14px; color: var(--co-text-dim); margin-bottom: 18px; }
        .sv-empty-cta { display: inline-flex; align-items: center; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; background: linear-gradient(135deg, var(--co-accent-blue), var(--co-accent)); color: var(--co-text-on-accent); border: none; cursor: pointer; }

        .sv-error-inline { margin-bottom: 14px; font-size: 12.5px; color: var(--co-red); }
        .sv-error { padding: 20px 16px; font-size: 13px; color: var(--co-red); background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 12px; }
        .sv-loading { padding: 40px 16px; text-align: center; font-size: 13px; color: var(--co-text-dim); }

        /* ── RWD ── */
        @media (max-width: 1023px) {
          .sv-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .sv-head { padding: 16px 16px 12px 16px; }
          .sv-tabs { padding: 12px 16px; }
          .sv-body { padding: 16px; }
          .sv-grid { grid-template-columns: 1fr; }
          .sv-title { font-size: 20px; }
        }
      `}</style>
    </main>
  );
}
