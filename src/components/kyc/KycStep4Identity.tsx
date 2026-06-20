import { useState, useRef } from 'react';
import type { AxiosError } from 'axios';
import type { AccountType, KycSubmitRequest } from '../../lib/api/coverones';
import { useKycVerifyId, useSubmitKyc } from '../../lib/query';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  validateLegalName,
  validateNationalId,
  validateBusinessId,
} from '../../utils/validation';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

interface KycStep4IdentityProps {
  accountType: AccountType;
  onSuccess: (promoted: boolean, currentTier: number, isPending: boolean) => void;
}

function mapVerifyIdError(err: unknown): string {
  const axErr = err as AxiosError<{ code?: string; message?: string }>;
  const code = axErr?.response?.data?.code;
  const status = axErr?.response?.status;

  if (code === 'ID_IMAGE_UNREADABLE') return '無法辨識身分證圖片，請重新拍攝清晰照片';
  if (code === 'ID_DATA_MISMATCH') return '身分資料不符，請確認姓名與身分證字號是否正確';
  if (code === 'DUPLICATE_IDENTITY') return '此身分證已綁定其他帳號，請聯繫客服';
  if (code === 'ACCOUNT_TYPE_NOT_SUPPORTED') return '公司帳號不支援身分證驗證，請使用統一編號';
  if (code === 'RATE_LIMITED' || status === 429) return '發送次數過多，請稍後再試';
  return axErr?.response?.data?.message ?? '驗證失敗，請稍後再試';
}

function mapSubmitError(err: unknown): string {
  const axErr = err as AxiosError<{ code?: string; message?: string }>;
  const code = axErr?.response?.data?.code;
  const status = axErr?.response?.status;
  if (code === 'RATE_LIMITED' || status === 429) return '提交次數過於頻繁，請於 15 分鐘後再試';
  if (code === 'VALIDATION_ERROR') return '輸入資料有誤，請檢查後再試一次';
  return axErr?.response?.data?.message ?? 'KYC 提交失敗，請稍後再試';
}

export function KycStep4Identity({ accountType, onSuccess }: KycStep4IdentityProps) {
  const verifyId = useKycVerifyId();
  const submitKyc = useSubmitKyc();

  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(accountType === 'COMPANY');

  // Text-submit fields
  const [legalName, setLegalName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [formError, setFormError] = useState('');

  const isPersonal = accountType === 'PERSONAL';
  const isPending = verifyId.isPending || submitKyc.isPending;

  // Image upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImageError('僅接受 JPEG 或 PNG 格式的圖片');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('圖片大小不得超過 8 MB');
      return;
    }
    setImageFile(file);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setImageError('請選擇身分證照片');
      return;
    }
    setFormError('');
    const fd = new FormData();
    fd.append('image', imageFile);
    try {
      const res = await verifyId.mutateAsync(fd);
      onSuccess(res.promoted, res.currentTier, false);
    } catch (err) {
      const axErr = err as AxiosError<{ code?: string }>;
      if (axErr?.response?.data?.code === 'ID_DATA_MISMATCH') {
        setFormError(mapVerifyIdError(err));
        setShowTextFallback(true);
      } else {
        setFormError(mapVerifyIdError(err));
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nameErr = validateLegalName(legalName);
    if (nameErr) { setFormError(nameErr); return; }

    let payload: KycSubmitRequest;
    if (isPersonal && !showTextFallback) {
      // Should not happen — PERSONAL uses image path unless fallback
      return;
    }

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
      const wasPending = !res.promoted && res.currentTier < 2;
      onSuccess(res.promoted, res.currentTier, wasPending);
    } catch (err) {
      setFormError(mapSubmitError(err));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-text)', marginBottom: 6 }}>
          Step 4 / 5 — 身分認證
        </h2>
        <p style={{ fontSize: 13, color: 'var(--co-text-dim)', lineHeight: 1.6 }}>
          {isPersonal && !showTextFallback
            ? '請上傳身分證正面照片，系統將自動辨識您的身分資訊。'
            : isPersonal
            ? '請填寫您的真實姓名與身分證字號進行文字認證。'
            : '公司帳號請填寫公司名稱與統一編號。'}
        </p>
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

      {/* PERSONAL via image upload (primary path) */}
      {isPersonal && !showTextFallback && (
        <form onSubmit={handleImageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              htmlFor="kyc-id-image"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-text-dim)' }}
            >
              身分證照片
            </label>
            <div
              style={{
                border: `2px dashed ${imageFile ? 'var(--co-green)' : 'var(--co-line-strong)'}`,
                borderRadius: 10,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                background: imageFile ? 'rgba(16,185,129,0.06)' : 'var(--co-bg-3)',
                transition: 'border-color 200ms',
              }}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label="選擇身分證照片"
            >
              {imageFile ? (
                <p style={{ fontSize: 13, color: 'var(--co-green)', fontWeight: 600 }}>
                  已選取：{imageFile.name}（{(imageFile.size / 1024 / 1024).toFixed(1)} MB）
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'var(--co-text-dim)' }}>
                    點擊選取或拖曳圖片至此
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--co-text-muted)', marginTop: 4 }}>
                    僅接受 JPEG / PNG，大小不超過 8 MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              id="kyc-id-image"
              type="file"
              accept="image/jpeg,image/png"
              aria-label="上傳身分證照片"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {imageError && (
              <p role="alert" style={{ fontSize: 12, color: 'var(--co-red)' }}>{imageError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={verifyId.isPending}
            disabled={!imageFile || isPending}
          >
            上傳並驗證身分證
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowTextFallback(true); setFormError(''); }}
            >
              改用文字填寫方式
            </Button>
          </div>
        </form>
      )}

      {/* Text-submit path (COMPANY always, PERSONAL fallback) */}
      {(accountType === 'COMPANY' || showTextFallback) && (
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isPersonal && showTextFallback && (
            <div style={{ textAlign: 'right' }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowTextFallback(false); setFormError(''); }}
              >
                改回上傳身分證照片
              </Button>
            </div>
          )}

          <Input
            label="真實姓名 / 公司名稱"
            id="kyc-s4-legalName"
            placeholder={isPersonal ? '王小明' : '台灣科技股份有限公司'}
            maxLength={100}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            autoComplete="name"
          />

          {isPersonal ? (
            <Input
              label="身分證字號"
              id="kyc-s4-nationalId"
              placeholder="A123456789"
              maxLength={10}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.toUpperCase())}
              autoComplete="off"
            />
          ) : (
            <Input
              label="統一編號"
              id="kyc-s4-businessId"
              placeholder="12345675"
              inputMode="numeric"
              maxLength={8}
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value.replace(/\D/g, ''))}
              autoComplete="off"
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitKyc.isPending}
            disabled={isPending}
          >
            提交認證資料
          </Button>
        </form>
      )}

      <p style={{ fontSize: 12, color: 'var(--co-text-muted)', lineHeight: 1.5, margin: 0 }}>
        我們僅將上述資訊用於身分驗證，通過後即解鎖發案與投標功能。
      </p>
    </div>
  );
}

export default KycStep4Identity;
