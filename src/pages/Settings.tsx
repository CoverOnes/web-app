import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Settings.css';
import { authApi, kycApi } from '../lib/api/coverones';
import type { OAuthProvider, ListIdentitiesResponse, KycStatusResponse } from '../lib/api/coverones';
import type { AuthUser } from '../store/authStore';
import { getApiErrorCode } from '../lib/api/http';
import { isFeatureEnabled } from '../features/flags/featureFlags';

// ─── Section IDs ──────────────────────────────────────────────────────────────

type SectionId =
  | 'company'
  | 'verification'
  | 'team'
  | 'plan'
  | 'api'
  | 'notifications';

interface NavSection {
  group: string;
  items: Array<{ id: SectionId; label: string; icon: React.ReactNode }>;
}

// ─── Inline SVG icons (no extra deps) ────────────────────────────────────────

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function IconCode() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const NAV_SECTIONS: NavSection[] = [
  {
    group: '企業',
    items: [
      { id: 'company', label: '公司資訊', icon: <IconBuilding /> },
      { id: 'verification', label: '認證與資格', icon: <IconShield /> },
      { id: 'team', label: '團隊成員', icon: <IconUsers /> },
      { id: 'plan', label: '方案與付款', icon: <IconCard /> },
    ],
  },
  {
    group: '開發者',
    items: [
      { id: 'api', label: 'API 金鑰', icon: <IconCode /> },
      { id: 'notifications', label: '通知偏好', icon: <IconBell /> },
    ],
  },
];

// ─── CompanySection ───────────────────────────────────────────────────────────

interface CompanySectionProps {
  profile: AuthUser | undefined;
  isLoading: boolean;
  isError: boolean;
}

function CompanySection({ profile, isLoading, isError }: CompanySectionProps) {
  const initials = profile?.displayName
    ? profile.displayName.charAt(0).toUpperCase()
    : '?';

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="載入公司資訊"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 48,
              borderRadius: 8,
              background: 'rgba(148,163,184,0.08)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: 'var(--co-red)',
          fontSize: 13,
        }}
      >
        無法載入公司資訊，請重新整理頁面。
      </div>
    );
  }

  return (
    <div>
      {/* Avatar row — gated by avatarSettings flag */}
      <div className="settings-row">
        <div className="settings-row-label">
          公司 LOGO
          {isFeatureEnabled('avatarSettings') && (
            <span className="settings-row-label-sub">頭像設定</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar placeholder — avatarSettings flag is on but backend not built */}
          {isFeatureEnabled('avatarSettings') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                aria-label="公司頭像"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--co-text-on-accent)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                {/* Avatar upload: backend not built — show ComingSoon inline */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'rgba(245,158,11,0.12)',
                    color: 'var(--co-amber)',
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  即將推出
                </div>
                <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginTop: 6 }}>
                  PNG/SVG · 至少 256×256 · 上傳功能即將開放
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div />
      </div>

      {/* Display name */}
      <div className="settings-row">
        <div className="settings-row-label">
          顯示名稱
          <span className="settings-row-label-sub">公開顯示名稱</span>
        </div>
        <div className="settings-row-value">
          {profile?.displayName ?? '—'}
        </div>
        <div />
      </div>

      {/* Email */}
      <div className="settings-row">
        <div className="settings-row-label">
          Email
          <span className="settings-row-label-sub">帳號登入信箱</span>
        </div>
        <div className="settings-row-value">
          {profile?.email ?? '—'}
        </div>
        <div />
      </div>

      {/* Account type */}
      <div className="settings-row">
        <div className="settings-row-label">
          帳號類型
          <span className="settings-row-label-sub">個人或公司</span>
        </div>
        <div className="settings-row-value">
          {profile?.accountType === 'COMPANY' ? '公司帳號' : profile?.accountType === 'PERSONAL' ? '個人帳號' : '—'}
        </div>
        <div />
      </div>

      {/* Note about missing PUT API */}
      <div
        style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(34,211,238,0.06)',
          border: '1px solid rgba(34,211,238,0.18)',
          fontSize: 12,
          color: 'var(--co-text-dim)',
        }}
      >
        資訊編輯功能（PUT /v1/me/profile）尚未開放，敬請期待。
      </div>
    </div>
  );
}

// ─── VerificationSection ──────────────────────────────────────────────────────

interface VerificationSectionProps {
  kycData: KycStatusResponse | undefined;
  kycLoading: boolean;
  kycError: boolean;
  identities: ListIdentitiesResponse | undefined;
  identitiesLoading: boolean;
  identitiesError: boolean;
  emailVerified: boolean;
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  line: 'LINE',
};
const PROVIDERS: OAuthProvider[] = ['google', 'line'];

function VerificationSection({
  kycData,
  kycLoading,
  kycError,
  identities,
  identitiesLoading,
  identitiesError,
  emailVerified,
}: VerificationSectionProps) {
  const qc = useQueryClient();
  const [unbindError, setUnbindError] = React.useState<string | null>(null);
  const [bindError, setBindError] = React.useState<string | null>(null);

  const unbind = useMutation<unknown, Error, OAuthProvider>({
    mutationFn: (provider) => authApi.unbindIdentity(provider) as Promise<unknown>,
    onSuccess: () => {
      setUnbindError(null);
      qc.invalidateQueries({ queryKey: ['me', 'identities'] });
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'LAST_LOGIN_METHOD') {
        setUnbindError('無法解除：此為唯一登入方式。');
      } else {
        setUnbindError('解除綁定失敗，請稍後再試。');
      }
    },
  });

  const boundProviders = new Set(identities?.identities.map((id) => id.provider) ?? []);
  const hasPassword = identities?.hasPassword ?? false;
  const identityCount = identities?.identities.length ?? 0;
  const isLastMethod = identityCount <= 1 && !hasPassword;

  const handleUnbind = (provider: OAuthProvider) => {
    setUnbindError(null);
    unbind.mutate(provider);
  };

  const handleBind = (provider: OAuthProvider) => {
    setBindError(null);
    authApi.bindIdentity(provider).catch(() => {
      setBindError('無法啟動綁定流程，請稍後再試。');
    });
  };

  // KYC tier label
  const tierLabel = (tier: number) => {
    if (tier >= 2) return '已完成 · Tier ' + tier;
    if (tier === 1) return '基本驗證 · Tier 1';
    return '未驗證';
  };

  const kycDone = (kycData?.currentTier ?? 0) >= 1;
  // Mirror the kycDone pattern: derive from real profile data so the card
  // stays honest and consistent with the UnverifiedBanner.
  const emailDone = emailVerified;

  return (
    <div>
      {/* KYC cards */}
      <div className="verify-grid">
        {/* KYC status card */}
        <div className={`verify-card${kycDone ? ' verify-card--done' : ''}`}>
          <div className="verify-card-header">
            <div className={`verify-card-icon${kycDone ? ' verify-card-icon--done' : ''}`}>
              {kycDone ? <IconCheck /> : <span aria-hidden="true">⚠</span>}
            </div>
            <div>
              <div className="verify-card-title">KYC 身分驗證</div>
              <div className={`verify-card-status${kycDone ? ' verify-card-status--done' : ' verify-card-status--warn'}`}>
                {kycLoading
                  ? '載入中…'
                  : kycError
                  ? '無法載入'
                  : tierLabel(kycData?.currentTier ?? 0)}
              </div>
            </div>
          </div>
          <div className="verify-card-desc">
            {kycError
              ? '無法載入 KYC 狀態，請重新整理頁面。'
              : kycDone
              ? '身分驗證已完成，您可以使用完整功能。'
              : '完成 KYC 驗證可解鎖投標、簽約等核心功能。'}
          </div>
        </div>

        {/* Email verification card */}
        <div className={`verify-card${emailDone ? ' verify-card--done' : ''}`}>
          <div className="verify-card-header">
            <div className={`verify-card-icon${emailDone ? ' verify-card-icon--done' : ''}`}>
              {emailDone ? <IconCheck /> : <span aria-hidden="true">⚠</span>}
            </div>
            <div>
              <div className="verify-card-title">Email 驗證</div>
              <div className={`verify-card-status${emailDone ? ' verify-card-status--done' : ' verify-card-status--warn'}`}>
                {emailDone ? '已驗證' : '未驗證'}
              </div>
            </div>
          </div>
          <div className="verify-card-desc">
            {emailDone
              ? '帳號 Email 已驗證，系統通知將正常發送。'
              : '請驗證您的 Email 以確保帳號通知正常發送。'}
          </div>
        </div>
      </div>

      {/* OAuth identities */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--co-text-muted)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}
        >
          社群帳號綁定
        </div>

        {unbindError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              color: 'var(--co-red)',
              fontSize: 13,
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: 10,
            }}
          >
            {unbindError}
          </div>
        )}
        {bindError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              color: 'var(--co-red)',
              fontSize: 13,
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: 10,
            }}
          >
            {bindError}
          </div>
        )}

        {identitiesLoading && (
          <div style={{ color: 'var(--co-text-dim)', fontSize: 13, padding: '8px 0' }}>
            載入中…
          </div>
        )}

        {identitiesError && !identitiesLoading && (
          <div
            role="alert"
            style={{
              color: 'var(--co-red)',
              fontSize: 13,
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            無法載入登入方式，請重新整理頁面。
          </div>
        )}

        {!identitiesLoading &&
          !identitiesError &&
          PROVIDERS.map((provider) => {
            const isBound = boundProviders.has(provider);
            const label = PROVIDER_LABEL[provider];
            const isPending = unbind.isPending && unbind.variables === provider;
            const cannotUnbind = isLastMethod;

            return (
              <div key={provider} className="settings-row">
                <div className="settings-row-label">
                  {label}
                  <span className="settings-row-label-sub">
                    {isBound ? '已綁定' : '尚未綁定'}
                  </span>
                </div>
                <div className="settings-row-value" />
                <div>
                  {isBound ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <button
                        type="button"
                        disabled={isPending || cannotUnbind}
                        onClick={() => handleUnbind(provider)}
                        aria-label={`解除綁定 ${label}`}
                        title={cannotUnbind ? '無法解除：此為唯一登入方式' : undefined}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.1)',
                          color: cannotUnbind ? 'var(--co-text-muted)' : 'var(--co-red)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: cannotUnbind || isPending ? 'not-allowed' : 'pointer',
                          opacity: cannotUnbind || isPending ? 0.5 : 1,
                          transition: 'opacity 150ms',
                          minWidth: 80,
                          minHeight: 44,
                        }}
                      >
                        {isPending ? '解除中…' : '解除綁定'}
                      </button>
                      {cannotUnbind && (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--co-text-muted)',
                            textAlign: 'right',
                            maxWidth: 160,
                          }}
                        >
                          此為唯一登入方式
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBind(provider)}
                      aria-label={`綁定 ${label}`}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.1)',
                        color: '#C7D2FE',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'opacity 150ms',
                        minWidth: 80,
                        minHeight: 44,
                      }}
                    >
                      綁定帳號
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Empty-state sections (no backing API) ────────────────────────────────────

function EmptyStateSection({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="region"
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          background: 'rgba(245,158,11,0.12)',
          color: 'var(--co-amber)',
          fontSize: 11,
          fontWeight: 600,
          border: '1px solid rgba(245,158,11,0.2)',
          marginBottom: 4,
        }}
      >
        即將推出 · Coming soon
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', maxWidth: 360, lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}

// ─── Accordion item (mobile) ──────────────────────────────────────────────────

interface AccordionItemProps {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ id, label, icon, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div className="settings-sec" id={`section-${id}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${id}`}
        onClick={onToggle}
        className="settings-accordion-btn"
      >
        <span className="settings-accordion-btn-inner">
          <span className="settings-nav-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </span>
        <span
          className="settings-accordion-chevron"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <IconChevronDown />
        </span>
      </button>
      {isOpen && (
        <div id={`accordion-panel-${id}`} role="region" aria-label={label} className="settings-sec-body">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────

const Settings = () => {
  const [activeSection, setActiveSection] = React.useState<SectionId>('company');
  const [openAccordion, setOpenAccordion] = React.useState<SectionId | null>('company');

  // Shared API queries
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<AuthUser>({
    queryKey: ['me', 'profile'],
    queryFn: () => authApi.me(),
  });

  const {
    data: kycData,
    isLoading: kycLoading,
    isError: kycError,
  } = useQuery<KycStatusResponse>({
    // Use the same key as useKycStatus() in lib/query.ts so that
    // useSubmitKyc's invalidateQueries({ queryKey: ['kyc-status'] }) also
    // refreshes this query and the card never shows stale "未驗證".
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus(),
  });

  const {
    data: identities,
    isLoading: identitiesLoading,
    isError: identitiesError,
  } = useQuery<ListIdentitiesResponse>({
    queryKey: ['me', 'identities'],
    queryFn: () => authApi.listIdentities(),
  });

  // Render content for each section
  const renderSectionContent = (id: SectionId) => {
    switch (id) {
      case 'company':
        return (
          <CompanySection
            profile={profile}
            isLoading={profileLoading}
            isError={profileError}
          />
        );

      case 'verification':
        return (
          <VerificationSection
            kycData={kycData}
            kycLoading={kycLoading}
            kycError={kycError}
            identities={identities}
            identitiesLoading={identitiesLoading}
            identitiesError={identitiesError}
            emailVerified={profile?.emailVerified ?? false}
          />
        );

      case 'team':
        return (
          <EmptyStateSection
            title="團隊成員管理"
            description="邀請團隊成員協作管理公司帳號。團隊管理 API 尚未開放，敬請期待。"
          />
        );

      case 'plan':
        return (
          <EmptyStateSection
            title="方案與付款"
            description="查看與管理您的訂閱方案及付款方式。方案管理功能尚未開放，敬請期待。"
          />
        );

      case 'api':
        return (
          <EmptyStateSection
            title="API 金鑰管理"
            description="透過 CoverOnes API 整合自家系統（ERP / CRM）。API 金鑰管理功能尚未開放，敬請期待。"
          />
        );

      case 'notifications':
        return (
          <EmptyStateSection
            title="通知偏好"
            description="自訂新需求媒合、投標進度、截標倒數等通知頻率與管道。通知偏好設定尚未開放，敬請期待。"
          />
        );

      default:
        return null;
    }
  };

  const renderSectionHeader = (id: SectionId) => {
    const sectionMeta: Record<SectionId, { title: string; subtitle: string }> = {
      company: {
        title: '公司資訊',
        subtitle: '您的公開公司頁資訊，影響系統媒合結果。',
      },
      verification: {
        title: '認證與資格',
        subtitle: '完成認證可顯著提升媒合精準度與買方信任。',
      },
      team: {
        title: '團隊成員',
        subtitle: '邀請最多 10 名團隊成員協作管理公司帳號。',
      },
      plan: {
        title: '方案與付款',
        subtitle: '管理您的訂閱方案與付款方式。',
      },
      api: {
        title: 'API 金鑰',
        subtitle: '透過 CoverOnes API 整合您的 ERP / CRM 系統。',
      },
      notifications: {
        title: '通知偏好',
        subtitle: '自訂各類通知的發送管道與頻率。',
      },
    };
    return sectionMeta[id];
  };

  // All sections flat list for accordion
  const allSections: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = NAV_SECTIONS.flatMap(
    (g) => g.items,
  );

  const handleAccordionToggle = (id: SectionId) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="settings-page">
      {/* Page header */}
      <div className="settings-page-head">
        <div>
          <h1 className="settings-page-title">設定</h1>
          <p className="settings-page-subtitle">
            {profile?.displayName ?? ''}{profile ? ' · ' : ''}帳號管理
          </p>
        </div>
      </div>

      {/* Desktop layout: sidebar + content */}
      <div className="settings-body">
        {/* Sidebar nav (desktop only) */}
        <aside className="settings-nav-side" aria-label="設定導覽">
          {NAV_SECTIONS.map((group) => (
            <div key={group.group}>
              <div className="settings-nav-group-title">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  onClick={() => setActiveSection(item.id)}
                  className={`settings-nav-item${activeSection === item.id ? ' settings-nav-item--active' : ''}`}
                >
                  <span className="settings-nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main content (desktop: single section, mobile: accordions) */}
        <div className="settings-content">
          {/* Desktop: show selected section */}
          <div className="settings-content-desktop">
            {(() => {
              const meta = renderSectionHeader(activeSection);
              return (
                <div
                  className="settings-sec"
                  id={`section-${activeSection}`}
                  aria-label={meta.title}
                >
                  <h2 className="settings-sec-title">{meta.title}</h2>
                  <p className="settings-sec-sub">{meta.subtitle}</p>
                  <div className="settings-sec-body">{renderSectionContent(activeSection)}</div>
                </div>
              );
            })()}
          </div>

          {/* Mobile: accordion for all sections */}
          <div className="settings-content-mobile">
            {allSections.map((item) => {
              const meta = renderSectionHeader(item.id);
              return (
                <AccordionItem
                  key={item.id}
                  id={item.id}
                  label={meta.title}
                  icon={item.icon}
                  isOpen={openAccordion === item.id}
                  onToggle={() => handleAccordionToggle(item.id)}
                >
                  <p className="settings-sec-sub">{meta.subtitle}</p>
                  {renderSectionContent(item.id)}
                </AccordionItem>
              );
            })}
          </div>
        </div>
      </div>

      {/* avatarSettings flag is enabled (P2); avatar upload backend not built yet — inline notice shown in CompanySection */}
    </div>
  );
};

export default Settings;
