/**
 * KycPage.tsx — Multi-step KYC onboarding wizard (Increment 3)
 *
 * Step flow:
 *   1 BasicInfo   → collect email + phone (local state only)
 *   2 EmailOTP    → OTP via /email/start + /email/verify
 *   3 PhoneOTP    → OTP via /phone/start + /phone/verify → may auto-promote tier 0→1
 *   4 Identity    → PERSONAL: image upload (/verify-id); COMPANY/fallback: text (/submit)
 *   5 Result      → show tier badge + navigation
 *
 * Re-entry: GET /kyc/me on mount derives startStep so the user resumes at the correct step.
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import { useKycMe } from '../lib/query';
import { PageHead } from '../components/layout/PageHead';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { KycStepIndicator } from '../components/kyc/KycStepIndicator';
import { deriveStartStep, deriveCompletedUpTo } from '../components/kyc/kycWizardUtils';
import { KycStep1BasicInfo } from '../components/kyc/KycStep1BasicInfo';
import { KycStep2EmailOtp } from '../components/kyc/KycStep2EmailOtp';
import { KycStep3PhoneOtp } from '../components/kyc/KycStep3PhoneOtp';
import { KycStep4Identity } from '../components/kyc/KycStep4Identity';
import { KycStep5Result } from '../components/kyc/KycStep5Result';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface WizardState {
  step: WizardStep;
  email: string;
  phone: string;
  emailCodeSent: boolean;
  phoneCodeSent: boolean;
  resultTier: number;
  resultIsPending: boolean;
}

const card: React.CSSProperties = {
  background: 'var(--co-bg-card)',
  border: '1px solid var(--co-line)',
  borderRadius: 14,
  padding: 28,
};

const KycPage = () => {
  const user = useAuthStore((s) => s.user);
  const refreshTokenInStore = useAuthStore((s) => s.refreshToken);
  const refreshTokens = useAuthStore((s) => s.refreshTokens);

  const { data: kycMe, isLoading: kycMeLoading } = useKycMe();

  const [wizard, setWizard] = useState<WizardState>({
    step: 1,
    email: '',
    phone: '',
    emailCodeSent: false,
    phoneCodeSent: false,
    resultTier: 0,
    resultIsPending: false,
  });
  const [initialized, setInitialized] = useState(false);

  // Mint a fresh JWT after tier promotion so kycTier claim is up-to-date.
  const promoteSession = async () => {
    if (!refreshTokenInStore) return;
    try {
      const { accessToken, refreshToken } = await authApi.refresh(refreshTokenInStore);
      refreshTokens(accessToken, refreshToken);
      const fresh = await authApi.me();
      useAuthStore.getState().setUser(fresh);
    } catch {
      // Token refresh is best-effort UX; the KYC itself already succeeded.
    }
  };

  // Derive startStep from kycMe once loaded (re-entry support).
  useEffect(() => {
    if (initialized || kycMeLoading) return;
    if (kycMe) {
      const startStep = deriveStartStep({
        currentTier: kycMe.currentTier,
        emailVerified: kycMe.emailVerified,
        phoneVerified: kycMe.phoneVerified,
      });
      setWizard((prev) => ({
        ...prev,
        step: startStep,
        resultTier: kycMe.currentTier,
      }));
    }
    setInitialized(true);
  }, [kycMe, kycMeLoading, initialized]);

  const currentTier = kycMe?.currentTier ?? user?.kycTier ?? 0;
  const completedUpTo = kycMe
    ? deriveCompletedUpTo({
        currentTier: kycMe.currentTier,
        emailVerified: kycMe.emailVerified,
        phoneVerified: kycMe.phoneVerified,
      })
    : wizard.step;

  // ── Step handlers ──────────────────────────────────────────────────────────

  const handleStep1Next = (email: string, phone: string) => {
    setWizard((prev) => ({ ...prev, step: 2, email, phone }));
  };

  const handleEmailVerified = () => {
    setWizard((prev) => ({ ...prev, step: 3, emailCodeSent: true }));
  };

  const handlePhoneVerified = async (promoted: boolean, tier: number) => {
    if (promoted) {
      useAuthStore.getState().setKycTierAtLeast(tier);
      await promoteSession();
    }
    setWizard((prev) => ({ ...prev, step: 4, phoneCodeSent: true }));
  };

  const handleIdentitySuccess = async (
    promoted: boolean,
    tier: number,
    isPending: boolean,
  ) => {
    if (promoted) {
      useAuthStore.getState().setKycTierAtLeast(tier);
      await promoteSession();
    }
    setWizard((prev) => ({
      ...prev,
      step: 5,
      resultTier: tier || currentTier,
      resultIsPending: isPending,
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--co-bg)',
        minHeight: '100%',
      }}
    >
      <PageHead
        crumb="主選單 / 身分認證"
        title="KYC 身分認證"
        description="完成身分認證以解鎖各項功能。"
      />

      <div
        style={{
          padding: '22px 28px 40px',
          maxWidth: 640,
          width: '100%',
        }}
      >
        {/* Loading skeleton while fetching /kyc/me */}
        {(!initialized || kycMeLoading) && (
          <div style={{ ...card }}>
            <LoadingSkeleton count={3} height="h-10" />
          </div>
        )}

        {initialized && !kycMeLoading && (
          <>
            <KycStepIndicator
              currentStep={wizard.step}
              completedUpTo={completedUpTo}
            />

            <div style={{ ...card }}>
              {wizard.step === 1 && (
                <KycStep1BasicInfo
                  kycMe={kycMe}
                  initialEmail={wizard.email}
                  initialPhone={wizard.phone}
                  onNext={handleStep1Next}
                />
              )}

              {wizard.step === 2 && (
                <KycStep2EmailOtp
                  email={wizard.email}
                  onVerified={handleEmailVerified}
                />
              )}

              {wizard.step === 3 && (
                <KycStep3PhoneOtp
                  phone={wizard.phone}
                  onVerified={handlePhoneVerified}
                />
              )}

              {wizard.step === 4 && (
                <KycStep4Identity
                  accountType={user?.accountType ?? 'PERSONAL'}
                  onSuccess={handleIdentitySuccess}
                />
              )}

              {wizard.step === 5 && (
                <KycStep5Result
                  currentTier={wizard.resultTier}
                  isPending={wizard.resultIsPending}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KycPage;
