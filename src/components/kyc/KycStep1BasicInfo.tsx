import { useState, useEffect } from 'react';
import type { KycMeResponse } from '../../lib/api/coverones';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface KycStep1BasicInfoProps {
  kycMe: KycMeResponse | undefined;
  initialEmail: string;
  initialPhone: string;
  onNext: (email: string, phone: string) => void;
}

/** Validate E.164 phone format: +[country code][number], 8-15 digits after + */
function validateE164(phone: string): string | null {
  if (!phone.trim()) return '請輸入手機號碼';
  if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
    return '請輸入 E.164 格式的手機號碼，例如 +886912345678';
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return '請輸入 Email 地址';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return '請輸入有效的 Email 地址';
  }
  return null;
}

export function KycStep1BasicInfo({ kycMe, initialEmail, initialPhone, onNext }: KycStep1BasicInfoProps) {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Pre-fill from kycMe masked values as placeholder hint only — user must enter real value
  useEffect(() => {
    if (!initialEmail && kycMe?.emailMasked) {
      // Don't pre-fill masked value — it's not the real email
    }
    if (!initialPhone && kycMe?.phoneMasked) {
      // Same for phone
    }
  }, [kycMe, initialEmail, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validateE164(phone);
    setEmailError(eErr ?? '');
    setPhoneError(pErr ?? '');
    if (eErr || pErr) return;
    onNext(email.trim(), phone.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-text)', marginBottom: 6 }}>
          Step 1 / 5 — 基本資訊
        </h2>
        <p style={{ fontSize: 13, color: 'var(--co-text-dim)', lineHeight: 1.6 }}>
          請輸入您的 Email 與手機號碼，我們將分別寄送驗證碼進行確認。
        </p>
      </div>

      {kycMe?.emailMasked && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--co-text-dim)',
          }}
        >
          目前已記錄的 Email：<strong style={{ color: 'var(--co-indigo-200)' }}>{kycMe.emailMasked}</strong>
          {kycMe.phoneMasked && (
            <>，手機：<strong style={{ color: 'var(--co-indigo-200)' }}>{kycMe.phoneMasked}</strong></>
          )}
        </div>
      )}

      <Input
        label="Email 地址"
        id="kyc-s1-email"
        type="email"
        placeholder="example@company.com"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
        error={emailError || undefined}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Input
          label="手機號碼"
          id="kyc-s1-phone"
          type="tel"
          placeholder="+886912345678"
          autoComplete="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
          error={phoneError || undefined}
        />
        <p style={{ fontSize: 11, color: 'var(--co-text-muted)', lineHeight: 1.5 }}>
          請使用 E.164 格式，例如台灣號碼：+886912345678
        </p>
      </div>

      <Button type="submit" variant="primary" size="md">
        下一步：Email 驗證
      </Button>
    </form>
  );
}

export default KycStep1BasicInfo;
