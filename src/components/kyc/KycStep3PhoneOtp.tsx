import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { useKycPhoneStart, useKycPhoneVerify } from '../../lib/query';
import { KycOtpInput } from './KycOtpInput';
import { Button } from '../ui/Button';

interface KycStep3PhoneOtpProps {
  phone: string;
  onVerified: (promoted: boolean, currentTier: number) => void;
}

function mapPhoneOtpError(err: unknown, attempt: number): string {
  const axErr = err as AxiosError<{ code?: string; message?: string }>;
  const code = axErr?.response?.data?.code;
  const status = axErr?.response?.status;

  if (code === 'CHALLENGE_EXPIRED') return '驗證碼已過期，請重新發送';
  if (code === 'CODE_MISMATCH') {
    const remaining = Math.max(0, 5 - attempt);
    return `驗證碼錯誤，請再試一次${remaining > 0 ? `（剩餘 ${remaining} 次）` : ''}`;
  }
  if (code === 'MAX_ATTEMPTS') return '嘗試次數過多，請重新發送驗證碼';
  if (code === 'CHALLENGE_NOT_FOUND') return '找不到驗證請求，請重新發送';
  if (code === 'RATE_LIMITED' || status === 429) return '發送次數過多，請於 15 分鐘後再試';
  return axErr?.response?.data?.message ?? '驗證失敗，請稍後再試';
}

const OTP_TTL_SECS = 600;
const RESEND_COOLDOWN_SECS = 60;

export function KycStep3PhoneOtp({ phone, onVerified }: KycStep3PhoneOtpProps) {
  const phoneStart = useKycPhoneStart();
  const phoneVerify = useKycPhoneVerify();

  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [ttlCountdown, setTtlCountdown] = useState(0);

  const startResendTimer = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN_SECS);
  }, []);

  const startTtlTimer = useCallback(() => {
    setTtlCountdown(OTP_TTL_SECS);
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  useEffect(() => {
    if (ttlCountdown <= 0) return;
    const id = setTimeout(() => setTtlCountdown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [ttlCountdown]);

  // Auto-send on mount
  useEffect(() => {
    handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    setError('');
    setOtp('');
    setAttempt(0);
    try {
      await phoneStart.mutateAsync({ phone });
      setCodeSent(true);
      startResendTimer();
      startTtlTimer();
    } catch (err) {
      const axErr = err as AxiosError<{ code?: string }>;
      const code = axErr?.response?.data?.code;
      const status = axErr?.response?.status;
      if (code === 'RATE_LIMITED' || status === 429) {
        setError('發送次數過多，請於 15 分鐘後再試');
      } else {
        setError('發送驗證碼失敗，請稍後再試');
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('請輸入完整的 6 位驗證碼');
      return;
    }
    setError('');
    const thisAttempt = attempt + 1;
    setAttempt(thisAttempt);
    try {
      const res = await phoneVerify.mutateAsync({ code: otp });
      if (res.phoneVerified) {
        onVerified(res.promoted, res.currentTier);
      }
    } catch (err) {
      const axErr = err as AxiosError<{ code?: string }>;
      // 409 ALREADY_VERIFIED → silently advance
      if (axErr?.response?.status === 409 || axErr?.response?.data?.code === 'ALREADY_VERIFIED') {
        onVerified(false, 0);
        return;
      }
      setError(mapPhoneOtpError(err, thisAttempt));
    }
  };

  const ttlMin = Math.floor(ttlCountdown / 60);
  const ttlSec = ttlCountdown % 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-text)', marginBottom: 6 }}>
          Step 3 / 5 — 手機驗證
        </h2>
        <p style={{ fontSize: 13, color: 'var(--co-text-dim)', lineHeight: 1.6 }}>
          驗證碼已寄送至 <strong style={{ color: 'var(--co-text)' }}>{phone}</strong>，請在 10 分鐘內輸入。
        </p>
      </div>

      {ttlCountdown > 0 && (
        <div style={{ fontSize: 12, color: 'var(--co-text-muted)', textAlign: 'center' }}>
          驗證碼有效時間：{ttlMin}:{String(ttlSec).padStart(2, '0')}
        </div>
      )}
      {ttlCountdown === 0 && codeSent && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8,
            fontSize: 13,
            color: '#FCD34D',
          }}
        >
          驗證碼已過期，請重新發送
        </div>
      )}

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <KycOtpInput value={otp} onChange={setOtp} disabled={phoneVerify.isPending} />

        {error && (
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
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={phoneVerify.isPending}
          disabled={otp.length < 6}
        >
          確認手機驗證碼
        </Button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSend}
          loading={phoneStart.isPending}
          disabled={resendCountdown > 0 || phoneStart.isPending}
        >
          {resendCountdown > 0 ? `重新發送（${resendCountdown}s）` : '重新發送驗證碼'}
        </Button>
      </div>
    </div>
  );
}

export default KycStep3PhoneOtp;
