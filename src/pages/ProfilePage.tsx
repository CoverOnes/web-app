import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './ProfilePage.css';
import { authApi } from '../lib/api/coverones';
import type { PublicProfile, OwnProfile, UpdateProfileRequest } from '../lib/api/coverones';
import { useAuthStore } from '../store/authStore';
import { getApiErrorCode } from '../lib/api/http';
import { httpsUrl } from '../lib/url';
import Avatar from '../components/ui/Avatar';

// ─── Inline SVG icons (no extra deps; mirrors Settings.tsx pattern) ───────────

function IconCamera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}

// ─── Tab definitions (static for pixel-match; only 總覽 has live content) ──────

const TABS = ['總覽', '經歷', '專案作品', '評價', '活動', '推薦語'] as const;
type TabId = (typeof TABS)[number];

// Stable id for the tabpanel content region (referenced by every tab's
// aria-controls; the panel's aria-labelledby points back at the active tab).
const PANEL_ID = 'profile-tabpanel';

// ─── Empty-state shell (deferred sections / no backing data) ──────────────────

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="profile-empty" role="note">
      {label ?? '尚無資料'}
    </div>
  );
}

// ─── Card primitive ────────────────────────────────────────────────────────────

interface CardProps {
  title: React.ReactNode;
  children: React.ReactNode;
}
function Card({ title, children }: CardProps) {
  return (
    <section className="profile-card">
      <h3 className="profile-card-h">{title}</h3>
      {children}
    </section>
  );
}

// ─── Edit form (own mode only) ────────────────────────────────────────────────

interface EditFormProps {
  profile: OwnProfile;
  onClose: () => void;
}

function EditForm({ profile, onClose }: EditFormProps) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [handle, setHandle] = React.useState(profile.handle ?? '');
  const [headline, setHeadline] = React.useState(profile.headline ?? '');
  const [bio, setBio] = React.useState(profile.bio ?? '');
  const [location, setLocation] = React.useState(profile.location ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatarUrl ?? '');
  const [coverUrl, setCoverUrl] = React.useState(profile.coverUrl ?? '');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const mutation = useMutation<OwnProfile, unknown, UpdateProfileRequest>({
    mutationFn: (data) => authApi.updateMyProfile(data),
    onSuccess: () => {
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ['profile', 'own'] });
      onClose();
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'HANDLE_TAKEN') {
        setErrorMsg('此 handle 已被使用，請換一個。');
      } else if (code === 'VALIDATION_ERROR') {
        setErrorMsg('欄位格式不正確，請檢查後再試一次。');
      } else {
        setErrorMsg('儲存失敗，請稍後再試。');
      }
    },
  });

  // Normalize empty strings back to null so the backend clears the field
  // (full-replace semantics per the api-contract).
  const emptyToNull = (v: string): string | null => {
    const t = v.trim();
    return t === '' ? null : t;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const payload: UpdateProfileRequest = {
      displayName: displayName.trim(),
      handle: emptyToNull(handle),
      headline: emptyToNull(headline),
      bio: emptyToNull(bio),
      location: emptyToNull(location),
      avatarUrl: emptyToNull(avatarUrl),
      coverUrl: emptyToNull(coverUrl),
    };
    mutation.mutate(payload);
  };

  return (
    <form className="profile-edit" onSubmit={handleSubmit} aria-label="編輯個人檔案表單">
      <h3 className="profile-card-h">編輯個人檔案</h3>

      {errorMsg && (
        <div role="alert" aria-live="polite" className="profile-edit-error">
          {errorMsg}
        </div>
      )}

      <label className="profile-field">
        <span className="profile-field-label">顯示名稱</span>
        <input
          type="text"
          className="profile-input"
          value={displayName}
          maxLength={80}
          required
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">Handle（公開帳號）</span>
        <input
          type="text"
          className="profile-input"
          value={handle}
          maxLength={30}
          placeholder="例：yourname（3–30 字 a-z 0-9 _）"
          onChange={(e) => setHandle(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">職稱 / 標題</span>
        <input
          type="text"
          className="profile-input"
          value={headline}
          maxLength={120}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">關於我</span>
        <textarea
          className="profile-input profile-textarea"
          value={bio}
          maxLength={2000}
          rows={5}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">所在地</span>
        <input
          type="text"
          className="profile-input"
          value={location}
          maxLength={100}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">頭像網址</span>
        <input
          type="url"
          className="profile-input"
          value={avatarUrl}
          placeholder="https://…"
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </label>

      <label className="profile-field">
        <span className="profile-field-label">封面網址</span>
        <input
          type="url"
          className="profile-input"
          value={coverUrl}
          placeholder="https://…"
          onChange={(e) => setCoverUrl(e.target.value)}
        />
      </label>

      <div className="profile-edit-actions">
        <button type="button" className="profile-btn profile-btn-secondary" onClick={onClose}>
          取消
        </button>
        <button type="submit" className="profile-btn profile-btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? '儲存中…' : '儲存變更'}
        </button>
      </div>
    </form>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="profile-page" role="status" aria-label="載入個人檔案">
      <div className="profile-cover profile-skel-cover" />
      <div className="profile-head">
        <div className="profile-head-row">
          <div className="profile-ava profile-skel-ava" />
          <div className="profile-head-info">
            <div className="profile-skel-line profile-skel-line--lg" />
            <div className="profile-skel-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const me = useAuthStore((s) => s.user);
  const isOwn = !userId || userId === me?.id;

  const [activeTab, setActiveTab] = React.useState<TabId>('總覽');
  const [editing, setEditing] = React.useState(false);

  // Own profile — only when own mode (never fetch own data in other mode).
  // Distinct key ['profile','own']: Settings.tsx owns ['me','profile'] with a
  // DIFFERENT endpoint/shape (authApi.me() → AuthUser); sharing the key caused
  // stale/blank fields + cross-page cache coupling.
  const ownQuery = useQuery<OwnProfile>({
    queryKey: ['profile', 'own'],
    queryFn: () => authApi.getMyProfile(),
    enabled: isOwn,
  });

  // Public profile — only when other mode (never call getMyProfile here).
  const publicQuery = useQuery<PublicProfile>({
    queryKey: ['profile', userId],
    queryFn: () => authApi.getPublicProfile(userId!),
    enabled: !!userId && !isOwn,
  });

  const activeQuery = isOwn ? ownQuery : publicQuery;
  const profile = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const notFound = !isOwn && getApiErrorCode(publicQuery.error) === 'USER_NOT_FOUND';

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-error-wrap">
          <div role="alert" className="profile-error">
            {notFound ? '找不到此使用者' : '無法載入個人檔案，請重新整理'}
          </div>
        </div>
      </div>
    );
  }

  // joinedAt → YYYY / MM (LIVE).
  const joined = (() => {
    const d = new Date(profile.joinedAt);
    if (Number.isNaN(d.getTime())) return '—';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()} / ${mm}`;
  })();

  const handleStr = profile.handle ? `@${profile.handle}` : null;

  // URL sink hardening (public page): only allow https: URLs as image sinks so
  // an attacker-set coverUrl/avatarUrl can't trigger an outbound fetch from any
  // viewer (tracking / SSRF-from-victim). CSS.escape() prevents url() injection.
  const safeCoverUrl = httpsUrl(profile.coverUrl);
  const safeAvatarUrl = httpsUrl(profile.avatarUrl);

  // The content region is the tabpanel for the active tab; label it by that tab.
  const activeTabId = `profile-tab-${TABS.indexOf(activeTab)}`;

  return (
    <div className="profile-page">
      {/* §1 Cover — LIVE (coverUrl bg; null → design gradient) */}
      <div
        className="profile-cover"
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
        {isOwn && (
          <button
            type="button"
            className="profile-cover-edit"
            aria-label="編輯封面"
            onClick={() => setEditing(true)}
          >
            <IconCamera /> 編輯封面
          </button>
        )}
      </div>

      {/* §2–6 Head */}
      <div className="profile-head">
        <div className="profile-head-row">
          {/* §2 Avatar — LIVE (null → initials via Avatar) + §2b verified badge */}
          <div className="profile-ava-wrap">
            <Avatar
              name={profile.displayName}
              src={safeAvatarUrl}
              pixelSize={144}
              color={['var(--co-accent)', 'var(--co-accent-2)']}
              ring
            />
            {/* §2b Verified badge — DERIVED (verified === true only) */}
            {profile.verified && (
              <span className="profile-vd" aria-label="已驗證帳號">
                <IconCheck />
              </span>
            )}
          </div>

          <div className="profile-head-info">
            {/* §3 Name + handle — LIVE */}
            <h1 className="profile-name">
              {profile.displayName}
              {handleStr && <span className="profile-handle">{handleStr}</span>}
            </h1>
            {/* §4 Headline — LIVE (null → hide) */}
            {profile.headline && <div className="profile-headline">{profile.headline}</div>}
            {/* §5 Meta — only location is LIVE; rest omitted (no fabrication) */}
            {profile.location && (
              <div className="profile-meta">
                <span><span aria-hidden="true">📍</span> {profile.location}</span>
              </div>
            )}
          </div>

          {/* §6 Head actions */}
          <div className="profile-head-actions">
            {isOwn ? (
              <button
                type="button"
                className="profile-btn profile-btn-primary"
                onClick={() => setEditing(true)}
              >
                <IconEdit /> 編輯個人檔案
              </button>
            ) : (
              <>
                <button type="button" className="profile-btn profile-btn-secondary" disabled aria-label="發送訊息（尚未開放）" title="尚未開放">
                  <span aria-hidden="true">📩</span> 發送訊息
                </button>
                <button type="button" className="profile-btn profile-btn-secondary" disabled aria-label="安排會議（尚未開放）" title="尚未開放">
                  <span aria-hidden="true">📅</span> 安排會議
                </button>
                <button type="button" className="profile-btn profile-btn-primary" disabled aria-label="加入人脈（尚未開放）" title="尚未開放">
                  <span aria-hidden="true">＋</span> 加入人脈
                </button>
              </>
            )}
          </div>
        </div>

        {/* §7 Tabs — static bar (總覽 default); non-總覽 → empty-state panel */}
        <div className="profile-tabs" role="tablist" aria-label="個人檔案分頁">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`profile-tab-${i}`}
              aria-selected={activeTab === tab}
              aria-controls={PANEL_ID}
              className={`profile-tab${activeTab === tab ? ' profile-tab--on' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Edit form (own only) replaces the layout body while editing */}
      {isOwn && editing ? (
        <div className="profile-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          <div className="profile-col-main">
            <EditForm profile={profile} onClose={() => setEditing(false)} />
          </div>
        </div>
      ) : activeTab !== '總覽' ? (
        <div className="profile-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          <div className="profile-col-main">
            <div className="profile-card">
              <EmptyState />
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-layout" role="tabpanel" id={PANEL_ID} aria-labelledby={activeTabId}>
          {/* Main column */}
          <div className="profile-col-main">
            {/* §8 About — LIVE (bio; null → 尚無自我介紹) */}
            <Card title="關於我">
              {profile.bio ? (
                <p className="profile-about-text">{profile.bio}</p>
              ) : (
                <EmptyState label="尚無自我介紹" />
              )}
            </Card>

            {/* §9 Skills — EMPTY-STATE */}
            <Card title="專業技能">
              <EmptyState />
            </Card>

            {/* §10 Experience — EMPTY-STATE */}
            <Card title="工作經歷">
              <EmptyState />
            </Card>

            {/* §11 Projects — EMPTY-STATE */}
            <Card title="精選專案">
              <EmptyState />
            </Card>

            {/* §12 Reviews — EMPTY-STATE */}
            <Card title="客戶評價">
              <EmptyState />
            </Card>
          </div>

          {/* Sidebar column */}
          <div className="profile-col-side">
            {/* §13 Platform reputation — only 加入時間 is LIVE; rest "—" */}
            <Card title={<><span aria-hidden="true">📊</span> 平台聲望</>}>
              <div className="profile-stat-row">
                <span>個人評分</span>
                <span className="profile-stat-v">—</span>
              </div>
              <div className="profile-stat-row">
                <span>已完成案件</span>
                <span className="profile-stat-v">—</span>
              </div>
              <div className="profile-stat-row">
                <span>累計合作金額</span>
                <span className="profile-stat-v">—</span>
              </div>
              <div className="profile-stat-row">
                <span>平均回覆時間</span>
                <span className="profile-stat-v">—</span>
              </div>
              <div className="profile-stat-row">
                <span>準時交付率</span>
                <span className="profile-stat-v">—</span>
              </div>
              <div className="profile-stat-row">
                <span>加入時間</span>
                <span className="profile-stat-v">{joined}</span>
              </div>
            </Card>

            {/* §14 Strengths — EMPTY-STATE */}
            <Card title={<><span aria-hidden="true">🎯</span> 我擅長的</>}>
              <EmptyState />
            </Card>

            {/* §15 Endorsements — EMPTY-STATE */}
            <Card title={<><span aria-hidden="true">🤝</span> 同事推薦語</>}>
              <EmptyState />
            </Card>

            {/* §16 Languages — EMPTY-STATE */}
            <Card title={<><span aria-hidden="true">🌐</span> 語言</>}>
              <EmptyState />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
