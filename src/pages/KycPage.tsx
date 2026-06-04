import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useKycStatus, useSubmitKyc } from '../lib/query';
import { authApi, type AccountType, type KycSubmitRequest } from '../lib/api/coverones';
import {
  validateLegalName,
  validateNationalId,
  validateBusinessId,
} from '../utils/validation';
import { PageHead } from '../components/layout/PageHead';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { VerifiedActionGate } from '../components/auth/VerifiedActionGate';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Icon } from '../components/ui/Icon';

const ACCOUNT_TABS: { id: AccountType; label: string }[] = [
  { id: 'PERSONAL', label: '個人' },
  { id: 'COMPANY', label: '公司' },
];

const card: React.CSSProperties = {
  background: 'var(--co-bg-card)',
  border: '1px solid var(--co-line)',
  borderRadius: 14,
  padding: 28,
};

const KycPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshTokenInStore = useAuthStore((s) => s.refreshToken);
  const refreshTokens = useAuthStore((s) => s.refreshTokens);

  const { data: status, isLoading, isError, refetch } = useKycStatus();
  const submitKyc = useSubmitKyc();

  // Default the registrant's account type from the logged-in user; let them
  // switch if needed. legalName prefills from displayName (the /me payload does
  // not carry legalName, so displayName is the best honest default).
  const initialType: AccountType =
    user?.accountType === 'COMPANY' ? 'COMPANY' : 'PERSONAL';
  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [legalName, setLegalName] = useState(user?.displayName ?? '');
  const [nationalId, setNationalId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [formError, setFormError] = useState('');
  // Local success flag so the success state survives a status refetch.
  const [promoted, setPromoted] = useState(false);

  const isPersonal = accountType === 'PERSONAL';
  const currentTier = status?.currentTier ?? user?.kycTier ?? 0;
  const alreadyTier2 = currentTier >= 2 || promoted;

  // Promote the in-memory session after a successful KYC: mint a fresh access
  // token so the new JWT carries kycTier=2; the 發案/投標 gates read kycTier from
  // the store, so this is what actually unlocks them without a full reload.
  const promoteSession = async () => {
    if (!refreshTokenInStore) return;
    try {
      const { accessToken, refreshToken } = await authApi.refresh(refreshTokenInStore);
      refreshTokens(accessToken, refreshToken);
      // Re-hydrate /me so the store's user.kycTier reflects the new tier.
      const fresh = await authApi.me();
      useAuthStore.getState().setUser(fresh);
    } catch {
      // Token refresh is best-effort UX; the KYC itself already succeeded. A
      // later navigation / reload will pick up the new tier via /me anyway.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nameErr = validateLegalName(legalName);
    if (nameErr) { setFormError(nameErr); return; }

    let payload: KycSubmitRequest;
    if (isPersonal) {
      const idErr = validateNationalId(nationalId);
      if (idErr) { setFormError(idErr); return; }
      payload = {
        accountType: 'PERSONAL',
        legalName: legalName.trim(),
        nationalId: nationalId.trim().toUpperCase(),
      };
    } else {
      const bizErr = validateBusinessId(businessId);
      if (bizErr) { setFormError(bizErr); return; }
      payload = {
        accountType: 'COMPANY',
        legalName: legalName.trim(),
        businessId: businessId.trim(),
      };
    }

    try {
      const res = await submitKyc.mutateAsync(payload);
      if (res.promoted || res.currentTier >= 2) {
        await promoteSession();
        setPromoted(true);
      } else {
        // Submitted but not auto-approved (e.g. pending manual review).
        await refetch();
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string; code?: string }>;
      const httpStatus = axErr.response?.status;
      const code = axErr.response?.data?.code;
      const byCode: Record<string, string> = {
        EMAIL_NOT_VERIFIED: '請先完成 email 驗證後再進行 KYC 認證。',
        RATE_LIMITED: '提交次數過於頻繁，請於 15 分鐘後再試。',
        VALIDATION_ERROR: '輸入資料有誤，請檢查後再試一次。',
      };
      if (code && byCode[code]) {
        setFormError(byCode[code]);
      } else if (httpStatus === 403) {
        setFormError('請先完成 email 驗證後再進行 KYC 認證。');
      } else if (httpStatus === 429) {
        setFormError('提交次數過於頻繁，請於 15 分鐘後再試。');
      } else {
        setFormError(axErr.response?.data?.message ?? 'KYC 提交失敗，請稍後再試。');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="主選單 / 身分認證"
        title="KYC 身分認證"
        description="完成認證以解鎖發案與投標功能（需 Tier 2）。"
      />

      <div style={{ padding: '22px 28px 40px 28px', maxWidth: 640 }}>
        {/* Current tier banner */}
        <div
          style={{
            ...card,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alreadyTier2 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              color: alreadyTier2 ? 'var(--co-green)' : 'var(--co-amber)',
            }}
          >
            {alreadyTier2 ? <Icon.Check size={22} /> : <Icon.Lock size={20} />}
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--co-text-muted)' }}>目前認證等級</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--co-text)' }}>
              {isLoading ? '載入中…' : `Tier ${currentTier}`}
            </div>
          </div>
        </div>

        {alreadyTier2 ? (
          /* ===== Success / already-verified state ===== */
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(34,197,94,0.15)',
                color: 'var(--co-green)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Icon.Check size={15} />
              已通過 KYC 認證 / Tier 2
            </div>
            <p style={{ fontSize: 14, color: 'var(--co-text-dim)', lineHeight: 1.6, margin: 0 }}>
              您的身分已通過認證，現在可以發布案件與提交投標。
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="primary" size="md" onClick={() => navigate('/jobs')}>
                前往案件看板
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/bids')}>
                我的投標
              </Button>
            </div>
          </div>
        ) : isError ? (
          <div style={{ ...card }}>
            <p style={{ fontSize: 14, color: 'var(--co-text-dim)', marginBottom: 12 }}>
              無法載入認證狀態，您仍可直接提交認證。
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              重新載入
            </Button>
          </div>
        ) : isLoading ? (
          <div style={{ ...card }}>
            <LoadingSkeleton count={4} height="h-10" />
          </div>
        ) : (
          /* ===== Submission form ===== */
          <form onSubmit={handleSubmit} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Account type toggle */}
            <div role="tablist" aria-label="帳號類型" style={{ display: 'flex', gap: 8 }}>
              {ACCOUNT_TABS.map((t) => {
                const active = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setAccountType(t.id); setFormError(''); }}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      border: `1px solid ${active ? 'var(--co-accent)' : 'var(--co-line)'}`,
                      background: active ? 'rgba(99,102,241,0.14)' : 'var(--co-bg-3)',
                      color: active ? '#C7D2FE' : 'var(--co-text-dim)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color 150ms, background 150ms',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#FCA5A5',
                }}
              >
                {formError}
              </div>
            )}

            <Input
              label="真實姓名"
              id="kyc-legalName"
              placeholder="王小明"
              maxLength={100}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              autoComplete="name"
            />

            {isPersonal ? (
              <Input
                label="身分證字號"
                id="kyc-nationalId"
                placeholder="A123456789"
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            ) : (
              <Input
                label="統一編號"
                id="kyc-businessId"
                placeholder="12345675"
                inputMode="numeric"
                maxLength={8}
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value.replace(/\D/g, ''))}
                autoComplete="off"
              />
            )}

            <VerifiedActionGate
              message="請先完成 email 驗證後再進行 KYC 認證"
              wrapperClassName="w-full"
            >
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitKyc.isPending}
                className="w-full"
              >
                提交認證
              </Button>
            </VerifiedActionGate>

            <p style={{ fontSize: 12, color: 'var(--co-text-muted)', lineHeight: 1.5, margin: 0 }}>
              我們僅將上述資訊用於身分驗證，通過後即解鎖發案與投標。
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default KycPage;
