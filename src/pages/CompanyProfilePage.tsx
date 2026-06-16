/**
 * CompanyProfilePage — public company profile (P4 Company vertical, frontend half)
 *
 * Design reference: design-reference/chat/project/CompanyProfile.html
 *
 * ── Data-source decision (zero fake data) ──────────────────────────────────────
 * Public page addressed by :companyId. Wired to the REAL public company API:
 * GET /api/user/v1/companies/:id (PII-safe CompanyProfile — no owner_user_id /
 * registration_no) + GET /api/user/v1/companies/:id/members. Everything rendered
 * with a name / number is derived from live API rows — NEVER fabricated.
 *
 * LIVE (real data):
 *   - Cover, logo (logoUrl; null → name initial), name + handle
 *   - Tagline (null → hide), industry / companySize / location / website
 *     (httpsUrl link) / foundedYear meta
 *   - About (about; null → 尚無公司簡介)
 *   - Team roster grid (核心採購窗口 — useCompanyMembers; isOwner → 負責人 badge)
 *
 * DEFER (empty-state / omitted — design showed these but no backend supports them
 * yet, so we render NOTHING fabricated):
 *   - cert badges (官方認證 / 鑽石採購), 瀏覽數, follow / message actions
 *     (rendered disabled "尚未開放"), stat-strip (追蹤者 / 已發案 …)
 *   - 能力地圖 radar → inline SVG core node + faint static scaffold +
 *     "尚無能力資料" overlay (NO fabricated 案數 / satellite counts)
 *   - 進行中招標, 合作夥伴評價, right rail (採購活躍 / 合作關係 / 動態 / 類似公司)
 *
 * not-found (COMPANY_NOT_FOUND / INVALID_COMPANY_ID) → 找不到此公司.
 *
 * Security: tokens only (var(--co-*)); no raw hex (incl. SVG radar). No
 * dangerouslySetInnerHTML; attacker-controlled logoUrl / coverUrl / website
 * hardened via httpsUrl(). Public queries gate on !!id.
 *
 * RWD:
 *   ≥768 (≥1100 here): 220 / 1fr / 320 grid; 1100–768 → 180 / 1fr / 280
 *   <768 (375): single column, side-nav hidden, right rail stacks below, team 2-col
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import './CompanyProfilePage.css';
import type { CompanyMember } from '../lib/api/coverones';
import { usePublicCompany, useCompanyMembers } from '../lib/query';
import { getApiErrorCode } from '../lib/api/http';
import { httpsUrl } from '../lib/url';

// ── Side-nav anchors (static; only sections with live content are wired) ────────
const NAV = [
  { id: 'about', label: '關於' },
  { id: 'capability', label: '能力地圖' },
  { id: 'team', label: '核心團隊' },
] as const;

// ── Inline SVG meta icons ───────────────────────────────────────────────────────
function IconIndustry() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    </svg>
  );
}
function IconPeople() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="9" cy="8" r="4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
    </svg>
  );
}

// ── Empty-state shell ────────────────────────────────────────────────────────────
function EmptyState({ label }: { label?: string }) {
  return (
    <div className="cp-empty" role="note">
      {label ?? '尚無資料'}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Capability radar — inline SVG EMPTY-STATE shell.
// Core node + faint static scaffold ONLY (no real ratings data exists yet). NO
// fabricated 案數 / satellite counts / category labels. Tokens only (no raw hex);
// the "尚無能力資料" overlay communicates the deferred state. No chart lib.
// ════════════════════════════════════════════════════════════════════════════
function CapabilityRadar() {
  // Six faint scaffold spokes (geometry only — conveys "this is where the map
  // will render" without asserting any data). Colours via tokens.
  const spokes = [
    { x: 120, y: 80, c: 'var(--co-amber)' },
    { x: 400, y: 70, c: 'var(--co-red)' },
    { x: 440, y: 220, c: 'var(--co-cyan)' },
    { x: 130, y: 270, c: 'var(--co-accent-2)' },
    { x: 320, y: 290, c: 'var(--co-green)' },
    { x: 80, y: 180, c: 'var(--co-pink)' },
  ];
  return (
    <div className="cp-cap-map">
      <svg viewBox="0 0 520 340" role="img" aria-label="能力地圖：尚無能力資料">
        <defs>
          <linearGradient id="cp-core-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--co-accent)" />
            <stop offset="100%" stopColor="var(--co-accent-2)" />
          </linearGradient>
        </defs>

        {/* Faint scaffold spokes (empty-state — no data asserted) */}
        <g strokeWidth="2" fill="none" opacity="0.18">
          {spokes.map((s, i) => (
            <path key={`sp-${i}`} d={`M260 170 L ${s.x} ${s.y}`} stroke={s.c} />
          ))}
        </g>

        {/* Faint satellite outlines (no numbers / labels) */}
        <g fill="none" opacity="0.22">
          {spokes.map((s, i) => (
            <circle key={`sn-${i}`} cx={s.x} cy={s.y} r="22" stroke={s.c} strokeWidth="2" />
          ))}
        </g>

        {/* Core node */}
        <circle cx="260" cy="170" r="48" fill="url(#cp-core-g)" stroke="var(--co-text)" strokeWidth="2" opacity="0.85" />
        <text
          x="260"
          y="176"
          textAnchor="middle"
          fontFamily="Inter"
          fontWeight="800"
          fontSize="18"
          fill="var(--co-text-on-accent)"
        >
          能力
        </text>
      </svg>
      <div className="cp-cap-overlay">
        <span>尚無能力資料</span>
      </div>
    </div>
  );
}

// ── Team member tile (LIVE; isOwner → 負責人 badge) ──────────────────────────────
function TeamTile({ member }: { member: CompanyMember }) {
  const safeAvatar = httpsUrl(member.avatarUrl);
  const initial = (member.displayName || '?').charAt(0).toUpperCase();
  return (
    <div className="cp-tm">
      <div className="cp-tm-av">
        {safeAvatar ? <img src={safeAvatar} alt="" /> : <span aria-hidden="true">{initial}</span>}
      </div>
      <div className="cp-tm-n">
        {member.displayName}
        {member.isOwner && <span className="cp-owner-badge">負責人</span>}
      </div>
      {member.headline && <div className="cp-tm-r">{member.headline}</div>}
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────
function CompanySkeleton() {
  return (
    <div className="cp-page" role="status" aria-label="載入公司頁">
      <div className="cp-cover cp-skel-cover" />
      <div className="cp-head">
        <div className="cp-head-row">
          <div className="cp-skel-logo" />
          <div className="cp-head-info">
            <div className="cp-skel-line cp-skel-line--lg" />
            <div className="cp-skel-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CompanyProfilePage
// ════════════════════════════════════════════════════════════════════════════
export default function CompanyProfilePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [activeNav, setActiveNav] = React.useState<string>('about');

  const companyQuery = usePublicCompany(companyId);
  const company = companyQuery.data;
  const membersQuery = useCompanyMembers(companyId);
  const members: CompanyMember[] = membersQuery.data?.members ?? [];

  if (companyQuery.isLoading) {
    return <CompanySkeleton />;
  }

  const errCode = getApiErrorCode(companyQuery.error);
  const notFound = errCode === 'COMPANY_NOT_FOUND' || errCode === 'INVALID_COMPANY_ID';

  if (companyQuery.isError || !company) {
    return (
      <div className="cp-page">
        <div className="cp-error-wrap">
          <div role="alert" className="cp-error">
            {notFound ? '找不到此公司' : '無法載入公司頁，請重新整理'}
          </div>
        </div>
      </div>
    );
  }

  // URL sink hardening (public page): only https: image sinks.
  const safeCoverUrl = httpsUrl(company.coverUrl);
  const safeLogoUrl = httpsUrl(company.logoUrl);
  const safeWebsite = httpsUrl(company.website);
  const logoInitial = (company.name || '?').charAt(0).toUpperCase();

  // Website display label (host only, falling back to the raw value).
  const websiteLabel = (() => {
    if (!safeWebsite) return null;
    try {
      return new URL(safeWebsite).host;
    } catch {
      return safeWebsite;
    }
  })();

  return (
    <div className="cp-page">
      {/* §1 Cover — LIVE (coverUrl bg; null → design gradient + grid) */}
      <div
        className="cp-cover"
        style={
          safeCoverUrl
            ? {
                backgroundImage: `url('${CSS.escape(safeCoverUrl)}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!safeCoverUrl && <div className="cp-cover-grid" aria-hidden="true" />}
      </div>

      {/* §2–6 Head */}
      <div className="cp-head">
        <div className="cp-head-row">
          {/* §2 Logo — LIVE (logoUrl image; null → name initial) */}
          <div className="cp-logo">
            {safeLogoUrl ? (
              <img className="cp-logo-img" src={safeLogoUrl} alt={`${company.name} logo`} />
            ) : (
              <span aria-hidden="true">{logoInitial}</span>
            )}
          </div>

          <div className="cp-head-info">
            {/* §3 Name + handle — LIVE */}
            <h1 className="cp-name">
              {company.name}
              {company.handle && <span className="cp-handle">@{company.handle}</span>}
            </h1>
            {/* §4 Tagline — LIVE (null → hide) */}
            {company.tagline && <p className="cp-tagline">{company.tagline}</p>}
            {/* §5 Meta — only LIVE fields (no fabricated 員工數/瀏覽數) */}
            <div className="cp-meta">
              {company.industry && (
                <span>
                  <IconIndustry /> {company.industry}
                </span>
              )}
              {company.companySize && (
                <span>
                  <IconPeople /> {company.companySize}
                </span>
              )}
              {company.location && (
                <span>
                  <IconPin /> {company.location}
                </span>
              )}
              {safeWebsite && websiteLabel && (
                <span>
                  <IconGlobe />{' '}
                  <a className="cp-website" href={safeWebsite} target="_blank" rel="noopener noreferrer nofollow">
                    {websiteLabel}
                  </a>
                </span>
              )}
              {company.foundedYear != null && (
                <span>
                  <IconCalendar /> 成立於 {company.foundedYear} 年
                </span>
              )}
            </div>
          </div>

          {/* §6 Head actions — DEFER (follow / message disabled 尚未開放) */}
          <div className="cp-head-actions">
            <button type="button" className="cp-btn cp-btn-primary" disabled aria-label="追蹤公司（尚未開放）" title="尚未開放">
              ＋ 追蹤公司
            </button>
            <button type="button" className="cp-btn cp-btn-secondary" disabled aria-label="私訊洽談（尚未開放）" title="尚未開放">
              私訊洽談
            </button>
          </div>
        </div>
      </div>

      {/* §7 Body: side-nav / main / right rail */}
      <div className="cp-body">
        {/* Side nav */}
        <nav className="cp-side-nav" aria-label="公司頁分區">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#cp-${n.id}`}
              className={activeNav === n.id ? 'cp-nav-on' : undefined}
              aria-current={activeNav === n.id ? 'true' : undefined}
              onClick={() => setActiveNav(n.id)}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Main column */}
        <div className="cp-main">
          {/* §8 About — LIVE (about; null → 尚無公司簡介) */}
          <section className="cp-sec" id="cp-about">
            <h2>關於{company.name}</h2>
            {company.about ? <p>{company.about}</p> : <EmptyState label="尚無公司簡介" />}
          </section>

          {/* §9 能力地圖 — EMPTY-STATE radar shell (no fabricated 案數) */}
          <section className="cp-sec" id="cp-capability">
            <h2>
              能力地圖
              <span className="cp-more">過往發案類別權重分布</span>
            </h2>
            <CapabilityRadar />
          </section>

          {/* §10 進行中招標 — EMPTY-STATE (no RFP/project backend yet) */}
          <section className="cp-sec">
            <h2>進行中公開招標</h2>
            <EmptyState />
          </section>

          {/* §11 核心採購窗口 (team) — LIVE */}
          <section className="cp-sec" id="cp-team">
            <h2>
              核心採購窗口
              {members.length > 0 && <span className="cp-more">{members.length} 位</span>}
            </h2>
            {membersQuery.isLoading ? (
              <EmptyState label="載入中…" />
            ) : membersQuery.isError ? (
              <div role="alert" className="cp-empty" style={{ color: 'var(--co-red)' }}>
                無法載入成員
              </div>
            ) : members.length === 0 ? (
              <EmptyState label="尚無成員" />
            ) : (
              <div className="cp-team">
                {members.map((m) => (
                  <TeamTile key={m.userId} member={m} />
                ))}
              </div>
            )}
          </section>

          {/* §12 合作夥伴評價 — EMPTY-STATE (no reviews backend yet) */}
          <section className="cp-sec">
            <h2>合作夥伴評價</h2>
            <EmptyState />
          </section>
        </div>

        {/* Right rail — DEFER (採購活躍 / 合作關係 / 動態 / 類似公司) */}
        <aside className="cp-right" aria-label="公司側欄">
          <div className="cp-card">
            <h3 className="cp-card-h">採購活躍訊號</h3>
            <EmptyState />
          </div>
          <div className="cp-card">
            <h3 className="cp-card-h">合作關係</h3>
            <EmptyState />
          </div>
          <div className="cp-card">
            <h3 className="cp-card-h">類似公司</h3>
            <EmptyState />
          </div>
        </aside>
      </div>
    </div>
  );
}
