import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCreateListing } from '../lib/query';
import { TierGuard } from '../components/auth/TierGuard';
import { VerifiedActionGate } from '../components/auth/VerifiedActionGate';
import { PageHead } from '../components/layout/PageHead';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { AxiosError } from 'axios';

const CURRENCY_OPTIONS = [
  { value: 'TWD', label: 'TWD' },
  { value: 'USD', label: 'USD' },
];

const CATEGORY_OPTIONS = [
  { value: 'DEV',     label: '軟體開發', emoji: '💻' },
  { value: 'DESIGN',  label: '設計創意', emoji: '🎨' },
  { value: 'MKT',     label: '行銷推廣', emoji: '📣' },
  { value: 'DATA',    label: '資料分析', emoji: '📊' },
  { value: 'WRITING', label: '文案撰寫', emoji: '✍️' },
  { value: 'VIDEO',   label: '影音製作', emoji: '🎬' },
  { value: 'CONSULT', label: '顧問諮詢', emoji: '🤝' },
  { value: 'OTHER',   label: '其他', emoji: '📦' },
];

const STEPS = ['基本資訊', '需求詳情', '發布設定'];

const PostJobPage = () => {
  const navigate = useNavigate();
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const createListing = useCreateListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [currency, setCurrency] = useState('TWD');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  if (kycTier < 2) {
    return <TierGuard requiredTier={2} fullPage>{null}</TierGuard>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('請填寫案件標題。'); return; }
    if (!description.trim()) { setError('請填寫案件說明。'); return; }
    setError('');

    try {
      const listing = await createListing.mutateAsync({
        title,
        description,
        budgetMin: budgetMin || undefined,
        budgetMax: budgetMax || undefined,
        currency,
      });
      navigate(`/jobs/${listing.id}`, { replace: true });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message ?? '建立案件失敗，請重試。');
    }
  };

  const inputStyle: React.CSSProperties = {
    height: 46,
    padding: '0 14px',
    background: 'var(--co-bg-3)',
    border: '1px solid var(--co-line)',
    borderRadius: 10,
    fontSize: 14,
    color: 'var(--co-text)',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms, box-shadow 150ms',
    display: 'block',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="案件看板 / 發布案件"
        title="發布案件需求"
      />

      {/* Stepper */}
      <div style={{ padding: '16px 28px 0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, idx) => {
            const isActive = idx === 0;
            const isDone = false;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? '1' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: isDone ? 'var(--co-green)'
                        : isActive ? 'var(--co-accent)'
                        : 'var(--co-bg-card-2)',
                      border: isActive ? '2px solid var(--co-accent)' : '2px solid var(--co-line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: isActive || isDone ? '#fff' : 'var(--co-text-muted)',
                      transition: 'background 200ms',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--co-text)' : 'var(--co-text-muted)',
                    }}
                  >
                    {step}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'var(--co-line)',
                      margin: '0 12px',
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ padding: '22px 28px 40px 28px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 22 }}>
          {/* Left: form */}
          <div>
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 14,
                padding: 28,
              }}
            >
              {error && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px', marginBottom: 18,
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8, fontSize: 13, color: '#FCA5A5',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Category grid */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--co-text-dim)', marginBottom: 10 }}>
                    案件類別
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: 8,
                            border: `1px solid ${isSelected ? 'var(--co-accent)' : 'var(--co-line)'}`,
                            background: isSelected ? 'rgba(99,102,241,0.14)' : 'var(--co-bg-3)',
                            color: isSelected ? '#C7D2FE' : 'var(--co-text-dim)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'border-color 150ms, background 150ms',
                          }}
                          aria-pressed={isSelected}
                        >
                          <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <Input
                  label="案件標題"
                  id="post-title"
                  placeholder="例：React 開發者 — 電商後台專案"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Description */}
                <Textarea
                  label="案件說明"
                  id="post-description"
                  placeholder="詳述案件需求、時程、驗收條件..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />

                {/* Budget */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
                  <div>
                    <label htmlFor="post-budgetMin" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--co-text-dim)', marginBottom: 6 }}>
                      預算下限
                    </label>
                    <input
                      id="post-budgetMin"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-accent)';
                        (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-line)';
                        (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="post-budgetMax" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--co-text-dim)', marginBottom: 6 }}>
                      預算上限
                    </label>
                    <input
                      id="post-budgetMax"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-accent)';
                        (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-line)';
                        (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <Select
                    label="幣別"
                    id="post-currency"
                    options={CURRENCY_OPTIONS}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      background: 'var(--co-bg-3)',
                      border: '1px solid var(--co-line-strong)',
                      color: 'var(--co-text-dim)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    儲存草稿
                  </button>
                  <VerifiedActionGate wrapperClassName="flex-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={createListing.isPending}
                      className="w-full"
                      style={{ height: 44 }}
                    >
                      發布案件
                    </Button>
                  </VerifiedActionGate>
                </div>
              </form>
            </div>
          </div>

          {/* Right: live preview + AI card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Live preview */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 14,
                padding: 20,
                position: 'sticky',
                top: 80,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, fontWeight: 500 }}>
                即時預覽
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--co-text)', marginBottom: 6, minHeight: 22 }}>
                {title || '案件標題將顯示於此'}
              </div>
              {category && (
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(99,102,241,0.18)',
                      color: '#C7D2FE',
                      fontWeight: 500,
                    }}
                  >
                    {CATEGORY_OPTIONS.find(c => c.value === category)?.label ?? category}
                  </span>
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--co-text-dim)',
                  lineHeight: 1.55,
                  marginBottom: 14,
                  minHeight: 40,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description || '案件說明將顯示於此...'}
              </div>
              {(budgetMin || budgetMax) && (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--co-green)' }}>
                  {currency} {budgetMin || '0'} – {budgetMax || '∞'}
                </div>
              )}
            </div>

            {/* AI suggestion (decorative) */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#C7D2FE', marginBottom: 6 }}>
                AI 建議 ✨
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', lineHeight: 1.55 }}>
                補充明確的技術需求和驗收條件，可提高 43% 的優質應標率。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;
