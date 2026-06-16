/**
 * MyCompanyPage — 我的公司 (P4 Company vertical, frontend half)
 *
 * Design reference: design-reference/chat/project/Company.html
 *
 * ── Data-source decision (zero fake data) ──────────────────────────────────────
 * Wired to the REAL company API. The owner's company is resolved server-side via
 * GET /api/user/v1/me/company (resolves caller.user.company_id → company, owner
 * view incl. registrationNo). The team roster comes from GET
 * /api/user/v1/companies/:id/members. Everything rendered with a name / number is
 * derived from live API rows — NEVER fabricated from the design mock.
 *
 * LIVE (real data):
 *   - Cover (coverUrl bg; null → design gradient)
 *   - Logo (logoUrl image; null → name initial)
 *   - Company name + handle, industry / location / companySize / foundedYear meta
 *   - About (about; null → 尚無公司簡介)
 *   - 編輯資料 button → owner edit form (full-replace → useUpdateMyCompany)
 *   - Team roster (useCompanyMembers; isOwner → 負責人 badge; empty → 尚無成員)
 *
 * DEFER (empty-state / omitted — design showed these but no backend supports them
 * yet, so we render NOTHING fabricated):
 *   - B+ 評等 / 認證 badges, 統編 / 信用 / 糾紛 head chips
 *   - stat-strip (完成專案 / 合作企業 / 準時交付率 …), 代表性實績, 客戶評價
 *   - 企業認證 verify-card, 核心能力 skill bars (no ratings data), 最近動態 timeline
 *   - non-總覽 tabs (關於我們 / 服務項目 / 過往實績 / 評價 / 企業動態)
 *
 * Security: tokens only (var(--co-*)); no raw hex. No dangerouslySetInnerHTML;
 * attacker-controlled logoUrl / coverUrl hardened via httpsUrl(). Authed query
 * gates on auth-ready (the hook does this internally). registrationNo is the
 * owner-only field surfaced from /me/company.
 *
 * RWD:
 *   ≥768 (≥1100 here): grid minmax(0,1fr) 360px; 1100–768 → 300px side rail
 *   <768 (375): single column, side rail stacks below, head stacks, name 22px
 */

import React from 'react';
import './MyCompanyPage.css';
import type { MyCompany, CompanyMember, UpdateCompanyRequest } from '../lib/api/coverones';
import { useMyCompany, useCompanyMembers, useUpdateMyCompany } from '../lib/query';
import { getApiErrorCode } from '../lib/api/http';
import { httpsUrl } from '../lib/url';

// ── Static tab bar (only 總覽 has live content; others → empty-state panel) ─────
const TABS = ['總覽', '關於我們', '服務項目', '過往實績', '團隊成員', '評價', '企業動態'] as const;
type TabId = (typeof TABS)[number];
const PANEL_ID = 'mc-tabpanel';

// ── Inline SVG icons (mirrors ProfilePage pattern; no extra deps) ──────────────
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}
function IconIndustry() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
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
function IconPeople() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="9" cy="8" r="4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
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

// ── Empty-state shell ──────────────────────────────────────────────────────────
function EmptyState({ label }: { label?: string }) {
  return (
    <div className="mc-empty" role="note">
      {label ?? '尚無資料'}
    </div>
  );
}

// ── Card primitive ─────────────────────────────────────────────────────────────
function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mc-card">
      <h3 className="mc-card-h">{title}</h3>
      {children}
    </section>
  );
}

// ── Team roster row (LIVE; isOwner → 負責人 badge) ──────────────────────────────
function TeamRow({ member }: { member: CompanyMember }) {
  return (
    <div className="mc-team-row">
      <CompanyAvatar name={member.displayName} src={httpsUrl(member.avatarUrl)} />
      <div className="mc-team-info">
        <div className="mc-team-name">
          {member.displayName}
          {member.handle && <span className="mc-team-handle">@{member.handle}</span>}
          {member.isOwner && <span className="mc-owner-badge">負責人</span>}
        </div>
        {member.headline && <div className="mc-team-role">{member.headline}</div>}
      </div>
    </div>
  );
}

// ── Small avatar (gradient initial; https-hardened image) ──────────────────────
function CompanyAvatar({ name, src }: { name: string; src?: string }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={36}
        height={36}
        style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--co-text-on-accent)',
        background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

// ── Owner edit form (full-replace → useUpdateMyCompany) ─────────────────────────
function EditForm({ company, onClose }: { company: MyCompany; onClose: () => void }) {
  const mutation = useUpdateMyCompany();
  const [name, setName] = React.useState(company.name);
  const [handle, setHandle] = React.useState(company.handle ?? '');
  const [tagline, setTagline] = React.useState(company.tagline ?? '');
  const [about, setAbout] = React.useState(company.about ?? '');
  const [location, setLocation] = React.useState(company.location ?? '');
  const [website, setWebsite] = React.useState(company.website ?? '');
  const [industry, setIndustry] = React.useState(company.industry ?? '');
  const [companySize, setCompanySize] = React.useState(company.companySize ?? '');
  const [foundedYear, setFoundedYear] = React.useState(
    company.foundedYear != null ? String(company.foundedYear) : '',
  );
  const [logoUrl, setLogoUrl] = React.useState(company.logoUrl ?? '');
  const [coverUrl, setCoverUrl] = React.useState(company.coverUrl ?? '');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Normalize empty → null so the backend clears the field (full-replace).
  const emptyToNull = (v: string): string | null => {
    const t = v.trim();
    return t === '' ? null : t;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const yearTrim = foundedYear.trim();
    // foundedYear: number | null — empty clears it; non-numeric is rejected.
    let foundedYearVal: number | null = null;
    if (yearTrim !== '') {
      const n = Number(yearTrim);
      if (!Number.isInteger(n)) {
        setErrorMsg('成立年份請輸入西元年（例：2019）。');
        return;
      }
      foundedYearVal = n;
    }
    const payload: UpdateCompanyRequest = {
      name: name.trim(),
      handle: emptyToNull(handle),
      tagline: emptyToNull(tagline),
      about: emptyToNull(about),
      location: emptyToNull(location),
      website: emptyToNull(website),
      industry: emptyToNull(industry),
      companySize: emptyToNull(companySize),
      foundedYear: foundedYearVal,
      logoUrl: emptyToNull(logoUrl),
      coverUrl: emptyToNull(coverUrl),
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        setErrorMsg(null);
        onClose();
      },
      onError: (err: unknown) => {
        const code = getApiErrorCode(err);
        if (code === 'HANDLE_TAKEN') {
          setErrorMsg('此 handle 已被使用，請換一個。');
        } else if (code === 'VALIDATION_ERROR') {
          setErrorMsg('欄位格式不正確，請檢查後再試一次。');
        } else if (code === 'NOT_COMPANY_OWNER') {
          setErrorMsg('只有公司負責人可以編輯公司資料。');
        } else {
          setErrorMsg('儲存失敗，請稍後再試。');
        }
      },
    });
  };

  return (
    <form className="mc-edit" onSubmit={handleSubmit} aria-label="編輯公司資料表單">
      <h3 className="mc-card-h">編輯公司資料</h3>

      {errorMsg && (
        <div role="alert" aria-live="polite" className="mc-edit-error">
          {errorMsg}
        </div>
      )}

      <label className="mc-field">
        <span className="mc-field-label">公司名稱</span>
        <input
          type="text"
          className="mc-input"
          value={name}
          maxLength={200}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="mc-field">
        <span className="mc-field-label">Handle（公開帳號）</span>
        <input
          type="text"
          className="mc-input"
          value={handle}
          maxLength={30}
          placeholder="例：acme（3–30 字 a-z 0-9 _）"
          onChange={(e) => setHandle(e.target.value)}
        />
      </label>

      <label className="mc-field">
        <span className="mc-field-label">一句話標語</span>
        <input
          type="text"
          className="mc-input"
          value={tagline}
          maxLength={120}
          onChange={(e) => setTagline(e.target.value)}
        />
      </label>

      <label className="mc-field">
        <span className="mc-field-label">公司簡介</span>
        <textarea
          className="mc-input mc-textarea"
          value={about}
          maxLength={2000}
          rows={5}
          onChange={(e) => setAbout(e.target.value)}
        />
      </label>

      <div className="mc-field-grid">
        <label className="mc-field">
          <span className="mc-field-label">產業</span>
          <input
            type="text"
            className="mc-input"
            value={industry}
            maxLength={60}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </label>
        <label className="mc-field">
          <span className="mc-field-label">公司規模</span>
          <input
            type="text"
            className="mc-input"
            value={companySize}
            maxLength={30}
            placeholder="例：50–100 人"
            onChange={(e) => setCompanySize(e.target.value)}
          />
        </label>
      </div>

      <div className="mc-field-grid">
        <label className="mc-field">
          <span className="mc-field-label">所在地</span>
          <input
            type="text"
            className="mc-input"
            value={location}
            maxLength={100}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="mc-field">
          <span className="mc-field-label">成立年份</span>
          <input
            type="text"
            inputMode="numeric"
            className="mc-input"
            value={foundedYear}
            placeholder="例：2019"
            onChange={(e) => setFoundedYear(e.target.value)}
          />
        </label>
      </div>

      <label className="mc-field">
        <span className="mc-field-label">官方網站</span>
        <input
          type="url"
          className="mc-input"
          value={website}
          placeholder="https://…"
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      <label className="mc-field">
        <span className="mc-field-label">公司 Logo 網址</span>
        <input
          type="url"
          className="mc-input"
          value={logoUrl}
          placeholder="https://…"
          onChange={(e) => setLogoUrl(e.target.value)}
        />
      </label>

      <label className="mc-field">
        <span className="mc-field-label">封面網址</span>
        <input
          type="url"
          className="mc-input"
          value={coverUrl}
          placeholder="https://…"
          onChange={(e) => setCoverUrl(e.target.value)}
        />
      </label>

      <div className="mc-edit-actions">
        <button type="button" className="mc-btn mc-btn-secondary" onClick={onClose}>
          取消
        </button>
        <button type="submit" className="mc-btn mc-btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? '儲存中…' : '儲存變更'}
        </button>
      </div>
    </form>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────
function CompanySkeleton() {
  return (
    <div className="mc-page" role="status" aria-label="載入公司資料">
      <div className="mc-cover mc-skel-cover" />
      <div className="mc-head">
        <div className="mc-head-row">
          <div className="mc-skel-logo" />
          <div className="mc-head-info">
            <div className="mc-skel-line mc-skel-line--lg" />
            <div className="mc-skel-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MyCompanyPage
// ════════════════════════════════════════════════════════════════════════════
export default function MyCompanyPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('總覽');
  const [editing, setEditing] = React.useState(false);

  const companyQuery = useMyCompany();
  const company = companyQuery.data;
  // Members roster gates on the resolved company id (public endpoint).
  const membersQuery = useCompanyMembers(company?.id);
  const members: CompanyMember[] = membersQuery.data?.members ?? [];

  if (companyQuery.isLoading) {
    return <CompanySkeleton />;
  }

  // COMPANY_NOT_FOUND (no company linked to the caller) is a distinct, expected
  // state — surface a clear empty rather than a generic error.
  const notFound = getApiErrorCode(companyQuery.error) === 'COMPANY_NOT_FOUND';

  if (companyQuery.isError || !company) {
    return (
      <div className="mc-page">
        <div className="mc-error-wrap">
          <div role="alert" className="mc-error">
            {notFound ? '你的帳號尚未綁定公司。' : '無法載入公司資料，請重新整理'}
          </div>
        </div>
      </div>
    );
  }

  // URL sink hardening: only https: image sinks (an attacker-set logo/cover URL
  // must not trigger an outbound fetch). CSS.escape prevents url() injection.
  const safeCoverUrl = httpsUrl(company.coverUrl);
  const safeLogoUrl = httpsUrl(company.logoUrl);
  const logoInitial = (company.name || '?').charAt(0).toUpperCase();

  const activeTabId = `mc-tab-${TABS.indexOf(activeTab)}`;

  return (
    <div className="mc-page">
      {/* §1 Cover — LIVE (coverUrl bg; null → design gradient) */}
      <div
        className="mc-cover"
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
        <button type="button" className="mc-cover-edit" aria-label="編輯公司資料" onClick={() => setEditing(true)}>
          <IconEdit /> 編輯資料
        </button>
      </div>

      {/* §2–6 Head */}
      <div className="mc-head">
        <div className="mc-head-row">
          {/* §2 Logo — LIVE (logoUrl image; null → name initial) */}
          <div className="mc-logo">
            {safeLogoUrl ? (
              <img className="mc-logo-img" src={safeLogoUrl} alt={`${company.name} logo`} />
            ) : (
              <span aria-hidden="true">{logoInitial}</span>
            )}
          </div>

          <div className="mc-head-info">
            {/* §3 Name + handle — LIVE */}
            <h1 className="mc-name">
              {company.name}
              {company.handle && <span className="mc-handle">@{company.handle}</span>}
            </h1>
            {/* §4 Tagline — LIVE (null → hide) */}
            {company.tagline && <div className="mc-team-role" style={{ marginTop: 6 }}>{company.tagline}</div>}
            {/* §5 Meta — only LIVE fields (no fabrication of 統編/信用/糾紛) */}
            <div className="mc-meta">
              {company.industry && (
                <span>
                  <IconIndustry /> {company.industry}
                </span>
              )}
              {company.location && (
                <span>
                  <IconPin /> {company.location}
                </span>
              )}
              {company.companySize && (
                <span>
                  <IconPeople /> {company.companySize}
                </span>
              )}
              {company.foundedYear != null && (
                <span>
                  <IconCalendar /> 成立 {company.foundedYear}
                </span>
              )}
              {/* registrationNo is owner-only (from /me/company); show only when present */}
              {company.registrationNo && <span>統編 {company.registrationNo}</span>}
            </div>
          </div>

          {/* §6 Head actions (owner) */}
          <div className="mc-head-actions">
            <button type="button" className="mc-btn mc-btn-primary" onClick={() => setEditing(true)}>
              <IconEdit /> 編輯資料
            </button>
          </div>
        </div>

        {/* §7 Tabs — static bar; non-總覽 → empty-state panel */}
        <div className="mc-tabs" role="tablist" aria-label="公司資料分頁">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`mc-tab-${i}`}
              aria-selected={activeTab === tab}
              aria-controls={PANEL_ID}
              className={`mc-tab${activeTab === tab ? ' mc-tab--on' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Edit form replaces the layout body while editing */}
      {editing ? (
        <div className="mc-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          <div className="mc-col-main">
            <EditForm company={company} onClose={() => setEditing(false)} />
          </div>
        </div>
      ) : activeTab !== '總覽' ? (
        <div className="mc-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          <div className="mc-col-main">
            <div className="mc-card">
              <EmptyState />
            </div>
          </div>
        </div>
      ) : (
        <div className="mc-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          {/* Main column */}
          <div className="mc-col-main">
            {/* §8 About — LIVE (about; null → 尚無公司簡介) */}
            <Card title={<>關於{company.name}</>}>
              {company.about ? (
                <p className="mc-about-text">{company.about}</p>
              ) : (
                <EmptyState label="尚無公司簡介" />
              )}
            </Card>

            {/* §9 代表性實績 — EMPTY-STATE (no project history backend yet) */}
            <Card title="代表性實績">
              <EmptyState />
            </Card>

            {/* §10 客戶評價 — EMPTY-STATE (no reviews backend yet) */}
            <Card title="客戶評價">
              <EmptyState />
            </Card>
          </div>

          {/* Side column */}
          <div className="mc-col-side">
            {/* §11 企業認證 — EMPTY-STATE (no certs backend yet) */}
            <Card title="企業認證狀態">
              <EmptyState />
            </Card>

            {/* §12 核心能力 — EMPTY-STATE (no ratings data) */}
            <Card title="核心能力">
              <EmptyState />
            </Card>

            {/* §13 Team roster — LIVE (useCompanyMembers; isOwner → 負責人) */}
            <Card
              title={
                <>
                  核心團隊
                  {members.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--co-text-dim)' }}>
                      {members.length} 位
                    </span>
                  )}
                </>
              }
            >
              {membersQuery.isLoading ? (
                <EmptyState label="載入中…" />
              ) : membersQuery.isError ? (
                <div role="alert" className="mc-empty" style={{ color: 'var(--co-red)' }}>
                  無法載入成員
                </div>
              ) : members.length === 0 ? (
                <EmptyState label="尚無成員" />
              ) : (
                members.map((m) => <TeamRow key={m.userId} member={m} />)
              )}
            </Card>

            {/* §14 最近動態 — EMPTY-STATE (no activity feed backend yet) */}
            <Card title="最近動態">
              <EmptyState />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
