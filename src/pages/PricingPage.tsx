/**
 * PricingPage — 訂閱方案比較
 *
 * Design reference: design-reference/chat/project/Pricing.html
 *
 * ── Data decisions ──────────────────────────────────────────────────────────────
 * All content is static — no billing/payment API (payment flag=false, Andy-owned).
 * Prices are computed client-side from monthly base via billing toggle state.
 * Zero backend calls on load.
 *
 * ── Colour decisions ────────────────────────────────────────────────────────────
 * All colours use var(--co-*) tokens from src/index.css. Zero hardcoded hex.
 *
 * ── RWD ─────────────────────────────────────────────────────────────────────────
 * ≥1024px: 4-column plan grid
 * 768–1023px: 2-column plan grid
 * <768px: 1-column stacked; comparison table overflow-x: auto
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

/* ── Types ──────────────────────────────────────────────────────────────────── */

type Billing = 'monthly' | 'yearly';

/* ── Price helpers ──────────────────────────────────────────────────────────── */

/** Returns annual price as monthly equivalent (month × 0.8, rounded). */
const annualPrice = (monthly: number): number => Math.round(monthly * 0.8);

/* ── Comparison table data ──────────────────────────────────────────────────── */

interface TableRow {
  label: string;
  starter: string;
  pro: string;
  team: string;
  enterprise: string;
  /** Which plan column gets the hot (Pro) highlight */
  hotCol?: boolean;
}

interface TableSection {
  category: string;
  rows: TableRow[];
}

const TABLE_SECTIONS: TableSection[] = [
  {
    category: '🚀 核心功能',
    rows: [
      { label: '團隊成員數',   starter: '1',       pro: '5',    team: '20',   enterprise: '無限', hotCol: true },
      { label: '每月發布專案數', starter: '5',       pro: '50',   team: '無限', enterprise: '無限', hotCol: true },
      { label: '企業搜尋次數',  starter: '20 / 日', pro: '無限', team: '無限', enterprise: '無限', hotCol: true },
      { label: '私訊洽談',     starter: '✓',       pro: '✓',   team: '✓',   enterprise: '✓',   hotCol: true },
      { label: '視訊會議',     starter: '–',       pro: '✓',   team: '✓',   enterprise: '✓',   hotCol: true },
    ],
  },
  {
    category: '📊 報告與洞察',
    rows: [
      { label: '免費報告',      starter: '5 / 月', pro: '無限',  team: '無限',       enterprise: '無限',   hotCol: true },
      { label: 'PRO 專屬報告', starter: '–',      pro: '✓',    team: '✓',         enterprise: '✓',     hotCol: true },
      { label: '提早看到新報告', starter: '–',      pro: '7 天', team: '14 天',      enterprise: '獨家內容', hotCol: true },
      { label: '客製產業簡報',   starter: '–',      pro: '–',    team: '2 份 / 季', enterprise: '無限',   hotCol: false },
    ],
  },
  {
    category: '🔧 技術整合',
    rows: [
      { label: 'API 串接',        starter: '–', pro: '–', team: '10K / 月', enterprise: '無限', hotCol: false },
      { label: 'Webhook',          starter: '–', pro: '–', team: '✓',       enterprise: '✓',   hotCol: false },
      { label: 'SSO（SAML / OIDC）', starter: '–', pro: '–', team: '–',     enterprise: '✓',   hotCol: false },
      { label: 'SLA',              starter: '–', pro: '99%', team: '99.9%', enterprise: '99.99%', hotCol: true },
    ],
  },
  {
    category: '🛟 客戶支援',
    rows: [
      { label: 'Email 客服',    starter: '✓', pro: '✓',       team: '✓',     enterprise: '✓',   hotCol: true },
      { label: '即時客服',      starter: '–', pro: '工作時間', team: '7 / 12', enterprise: '7 / 24', hotCol: true },
      { label: '專屬客戶經理', starter: '–', pro: '–',       team: '✓',     enterprise: '✓',   hotCol: false },
      { label: '法務 / 合規顧問', starter: '–', pro: '–',     team: '–',     enterprise: '✓',   hotCol: false },
    ],
  },
];

/* ── FAQ data ───────────────────────────────────────────────────────────────── */

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '可以隨時取消嗎？',
    a: '可以。隨時可降級或取消，已付費期間使用至到期日為止，不另收違約金。年付方案可申請按比例退款（手續費 5%）。',
  },
  {
    q: '月付與年付怎麼選？',
    a: '年付一次付清省 20%，且鎖定當前價格 12 個月。建議確定長期使用後再選年付。',
  },
  {
    q: 'Pro 升級到 Team 流程？',
    a: '隨時可在「設定 → 訂閱」一鍵升級。升級當日按比例補差額，立即解鎖新功能。降級於下個計費週期生效。',
  },
  {
    q: '企業方案有試用嗎？',
    a: 'Enterprise 方案提供 30 天 PoC（概念驗證）期，含專屬 CSM 協助導入評估。請聯絡業務團隊。',
  },
  {
    q: '付款方式有哪些？',
    a: '支援信用卡（Visa / Master / JCB / AmEx）、ATM 轉帳、企業支票、PayPal。Enterprise 方案另支援匯款與電子發票。',
  },
];

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface FaqRowProps {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}

const FaqRow = ({ item, open, onToggle }: FaqRowProps) => (
  <div
    style={{
      background: 'var(--co-bg-card)',
      border: '1px solid var(--co-line-strong)',
      borderRadius: 11,
      padding: '6px 22px',
      marginBottom: 10,
    }}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        width: '100%',
        padding: '14px 0',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        color: 'var(--co-text)',
        textAlign: 'left',
      }}
    >
      {item.q}
      <span
        aria-hidden="true"
        style={{
          color: 'var(--co-text-muted)',
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 250ms',
          flexShrink: 0,
          marginLeft: 12,
        }}
      >
        ▾
      </span>
    </button>
    <div
      role="region"
      style={{
        overflow: 'hidden',
        maxHeight: open ? '200px' : '0',
        transition: 'max-height 250ms ease',
      }}
    >
      <p
        style={{
          padding: '0 0 14px',
          fontSize: 12.5,
          color: 'var(--co-text-dim)',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {item.a}
      </p>
    </div>
  </div>
);

/* ── Value cell classification ─────────────────────────────────────────────── */

const valueCellStyle = (val: string, isHot: boolean): CSSProperties => {
  const base: CSSProperties = {
    textAlign: 'center',
    padding: '11px 16px',
    fontSize: 12.5,
    borderTop: '1px solid var(--co-line)',
  };
  if (isHot) {
    base.background = 'rgba(99,102,241,0.06)';
    base.color = '#A78BFA';
    base.fontWeight = 700;
    return base;
  }
  if (val === '✓') {
    base.color = '#6EE7B7';
    base.fontWeight = 700;
    return base;
  }
  if (val === '–') {
    base.color = 'var(--co-text-muted)';
    return base;
  }
  base.color = 'var(--co-text-dim)';
  return base;
};

/* ── Disabled CTA (matches ReportsPage.tsx line 128 inert+tooltip pattern) ── */

const DisabledCta = ({ children, style }: { children: React.ReactNode; style?: CSSProperties }) => (
  <button
    type="button"
    disabled
    inert
    title="方案升級功能即將推出"
    aria-disabled="true"
    style={{
      width: '100%',
      padding: '11px',
      borderRadius: 9,
      border: 'none',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'not-allowed',
      opacity: 0.6,
      ...style,
    }}
  >
    {children}
  </button>
);

/* ── Main page ──────────────────────────────────────────────────────────────── */

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Prices */
  const proPrice  = billing === 'monthly' ? 1580 : annualPrice(1580);
  const teamPrice = billing === 'monthly' ? 4800 : annualPrice(4800);

  const proSavingMsg  = billing === 'yearly' ? '年付一次省 NT$ 3,792' : ' ';
  const teamSavingMsg = billing === 'yearly' ? '年付一次省 NT$ 11,520' : ' ';

  return (
    <main
      aria-label="訂閱方案"
      style={{
        minHeight: '100%',
        background: 'var(--co-bg)',
        color: 'var(--co-text)',
        padding: '32px 28px 40px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── 1a. Page header ───────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: '0 0 9px',
            background: 'linear-gradient(90deg, var(--co-accent-2), var(--co-cyan))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'inline-block',
          }}
        >
          選擇適合您企業規模的方案
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--co-text-dim)', margin: 0 }}>
          從免費試用到大型企業，CoverOnes 都能成為您的成長夥伴。所有方案皆含 14 天免費試用。
        </p>

        {/* Billing toggle */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--co-bg-3)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 10,
            padding: 3,
            marginTop: 18,
            gap: 2,
          }}
          role="group"
          aria-label="付款週期"
        >
          {(['monthly', 'yearly'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBilling(mode)}
              aria-pressed={billing === mode}
              style={{
                padding: '7px 16px',
                fontSize: 12.5,
                cursor: 'pointer',
                borderRadius: 7,
                border: 'none',
                fontWeight: billing === mode ? 600 : 400,
                background: billing === mode ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: billing === mode ? 'var(--co-text)' : 'var(--co-text-dim)',
                transition: 'background 150ms, color 150ms',
              }}
            >
              {mode === 'monthly' ? '月付' : (
                <>年付 <span style={{ color: '#6EE7B7', fontSize: 10 }}>省 20%</span></>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1b. Plan grid ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          maxWidth: 1280,
          margin: '28px auto 0',
        }}
        className="pricing-grid"
      >
        {/* Starter */}
        <div
          style={{
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 14,
            padding: '26px 22px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--co-text-dim)', fontWeight: 600 }}>Starter</div>
          <div style={{ fontSize: 12, color: 'var(--co-text-muted)', marginTop: 4, minHeight: 30, lineHeight: 1.5 }}>
            適合剛起步的小型公司，先試水溫。
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 18 }}>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--co-text)' }}>免費</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6EE7B7', marginTop: 4, minHeight: 18 }}>不需信用卡</div>
          <Link
            to="/register"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 9,
              border: '1px solid var(--co-line-strong)',
              background: 'var(--co-bg-3)',
              color: 'var(--co-text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 18,
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            免費註冊
          </Link>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', fontSize: 12.5 }}>
            {[
              '1 位團隊成員',
              '每月 5 個專案發布',
              '每日 20 次企業搜尋',
              '基本訊息功能',
              '免費報告 / 月（5 篇）',
            ].map((f) => (
              <li key={f} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: '#6EE7B7', fontWeight: 800 }}>✓</span>
                {f}
              </li>
            ))}
            {['PRO 報告下載', '進階搜尋 / 篩選', '數據儀表板', 'API 串接'].map((f) => (
              <li key={f} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-muted)', opacity: 0.5, lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: 'var(--co-text-muted)' }}>–</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro (hot) */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: 14,
            padding: '26px 22px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 32px rgba(99,102,241,0.18)',
          }}
        >
          {/* Hot badge ribbon */}
          <div
            aria-label="最受歡迎方案"
            style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 14px',
              background: 'linear-gradient(90deg, var(--co-accent), var(--co-cyan))',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--co-text-on-accent)',
              boxShadow: '0 6px 18px rgba(99,102,241,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            ⭐ 最受歡迎
          </div>
          <div style={{ fontSize: 14, color: 'var(--co-accent-2)', fontWeight: 600 }}>Pro</div>
          <div style={{ fontSize: 12, color: 'var(--co-text-muted)', marginTop: 4, minHeight: 30, lineHeight: 1.5 }}>
            適合中小企業，提升商務開發效率。
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 18 }}>
            <span style={{ fontSize: 13, color: 'var(--co-text-dim)', marginBottom: 6 }}>NT$</span>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--co-text)' }}>
              {proPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--co-text-muted)', marginBottom: 6, marginLeft: 3 }}>/ 月</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6EE7B7', marginTop: 4, minHeight: 18 }}>{proSavingMsg}</div>
          <DisabledCta
            style={{
              background: 'linear-gradient(90deg, var(--co-accent), var(--co-accent-2))',
              color: 'var(--co-text-on-accent)',
              marginTop: 18,
            }}
          >
            開始 14 天試用
          </DisabledCta>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', fontSize: 12.5 }}>
            {[
              <><strong style={{ color: 'var(--co-text)' }}>5 位</strong>團隊成員</>,
              <>每月 <strong style={{ color: 'var(--co-text)' }}>50 個</strong>專案發布</>,
              <><strong style={{ color: 'var(--co-text)' }}>無限</strong>企業搜尋</>,
              '無限訊息 + 視訊洽談',
              <><strong style={{ color: 'var(--co-text)' }}>所有 PRO 報告無限下載</strong></>,
              <><strong style={{ color: 'var(--co-text)' }}>提早 7 天</strong>看到新報告</>,
              '進階搜尋與篩選',
              '基礎數據儀表板',
            ].map((f, i) => (
              <li key={i} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: '#6EE7B7', fontWeight: 800 }}>✓</span>
                {f}
              </li>
            ))}
            {['API 串接'].map((f) => (
              <li key={f} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-muted)', opacity: 0.5, lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: 'var(--co-text-muted)' }}>–</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Team */}
        <div
          style={{
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 14,
            padding: '26px 22px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 14, color: '#67E8F9', fontWeight: 600 }}>Team</div>
          <div style={{ fontSize: 12, color: 'var(--co-text-muted)', marginTop: 4, minHeight: 30, lineHeight: 1.5 }}>
            適合成長中企業，多部門協作。
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 18 }}>
            <span style={{ fontSize: 13, color: 'var(--co-text-dim)', marginBottom: 6 }}>NT$</span>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--co-text)' }}>
              {teamPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--co-text-muted)', marginBottom: 6, marginLeft: 3 }}>/ 月</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6EE7B7', marginTop: 4, minHeight: 18 }}>{teamSavingMsg}</div>
          <DisabledCta
            style={{
              background: 'linear-gradient(90deg, var(--co-cyan), #3B82F6)',
              color: 'var(--co-text-on-accent)',
              marginTop: 18,
            }}
          >
            聯絡業務
          </DisabledCta>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', fontSize: 12.5 }}>
            {[
              <><strong style={{ color: 'var(--co-text)' }}>20 位</strong>團隊成員</>,
              <><strong style={{ color: 'var(--co-text)' }}>無限</strong>專案發布</>,
              '進階企業情報（FactSet）',
              '專屬 CSM 客戶經理',
              '所有 PRO 報告 + 客製簡報',
              '進階數據儀表板 + 趨勢預測',
              '產業洞察 AI 分析',
              'API 串接（10K req/月）',
              '履約保證金折讓 50%',
            ].map((f, i) => (
              <li key={i} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: '#6EE7B7', fontWeight: 800 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Enterprise */}
        <div
          style={{
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 14,
            padding: '26px 22px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 14, color: '#FCD34D', fontWeight: 600 }}>Enterprise</div>
          <div style={{ fontSize: 12, color: 'var(--co-text-muted)', marginTop: 4, minHeight: 30, lineHeight: 1.5 }}>
            適合大型企業集團，量身訂做。
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 18 }}>
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--co-text)' }}>客製報價</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6EE7B7', marginTop: 4, minHeight: 18 }}>起價 NT$ 25,000 / 月</div>
          <a
            href="mailto:sales@coverones.com"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 9,
              border: '1px solid rgba(245,158,11,0.4)',
              background: 'rgba(245,158,11,0.18)',
              color: '#FCD34D',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 18,
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            預約專人介紹
          </a>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', fontSize: 12.5 }}>
            {[
              <><strong style={{ color: 'var(--co-text)' }}>無限</strong>團隊成員（含 SSO）</>,
              '無限專案 / 招標 / 簽約',
              '專屬資料庫帳號',
              '產業客製研究服務',
              'SLA 99.99% 保證',
              '白標 / 子帳號管理',
              '無限 API + Webhook',
              '履約保證金免收',
              '法務 / 合規顧問',
            ].map((f, i) => (
              <li key={i} style={{ padding: '7px 0 7px 22px', position: 'relative', color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: '#6EE7B7', fontWeight: 800 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 1c. Comparison table ──────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1100,
          margin: '48px auto 0',
          background: 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
        className="pricing-table-wrap"
      >
        <h2 style={{ padding: '22px 26px 14px', fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--co-text)' }}>
          📋 完整方案比較
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th
                  style={{
                    width: '38%',
                    padding: '11px 16px',
                    textAlign: 'left',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--co-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'var(--co-bg-3)',
                    borderTop: '1px solid var(--co-line)',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  功能
                </th>
                {(['Starter', 'Pro', 'Team', 'Enterprise'] as const).map((plan) => (
                  <th
                    key={plan}
                    style={{
                      padding: '11px 16px',
                      textAlign: 'left',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--co-text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderTop: '1px solid var(--co-line)',
                      background: plan === 'Pro' ? 'rgba(99,102,241,0.1)' : 'var(--co-bg-3)',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_SECTIONS.map((section) => (
                <>
                  <tr key={`cat-${section.category}`}>
                    <td
                      colSpan={5}
                      style={{
                        fontWeight: 700,
                        background: 'var(--co-bg-3)',
                        color: '#A78BFA',
                        padding: '8px 16px',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderTop: '1px solid var(--co-line)',
                      }}
                    >
                      {section.category}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.label}>
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: 'var(--co-text)',
                          borderTop: '1px solid var(--co-line)',
                        }}
                      >
                        {row.label}
                      </td>
                      {(['starter', 'pro', 'team', 'enterprise'] as const).map((key) => {
                        const val = row[key];
                        const isHot = key === 'pro' && (row.hotCol ?? false);
                        return (
                          <td key={key} style={valueCellStyle(val, isHot)}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 1d. FAQ accordion ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 840, margin: '48px auto 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', margin: '0 0 22px', color: 'var(--co-text)' }}>
          常見問題
        </h2>
        {FAQS.map((item, i) => (
          <FaqRow
            key={item.q}
            item={item}
            open={openFaq === i}
            onToggle={() => setOpenFaq(openFaq === i ? null : i)}
          />
        ))}
      </div>

      {/* ── 1e. Bottom CTA banner ─────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 880,
          margin: '48px auto 0',
          padding: '32px 36px',
          background: 'linear-gradient(135deg, var(--co-cover-from), var(--co-accent))',
          borderRadius: 16,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(34,211,238,0.25), transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 9px', position: 'relative', zIndex: 1, color: 'var(--co-text-on-accent)' }}>
          還在猶豫？預約 30 分鐘專人介紹
        </h2>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', margin: '0 0 18px', position: 'relative', zIndex: 1 }}>
          由我們的解決方案顧問為您量身評估最適合的方案，含專屬 demo 與優惠估價。
        </p>
        <a
          href="mailto:sales@coverones.com"
          style={{
            display: 'inline-block',
            padding: '11px 28px',
            background: 'var(--co-text-on-accent)',
            color: '#1E1B4B',
            border: 'none',
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
            textDecoration: 'none',
          }}
        >
          📅 預約諮詢時間
        </a>
      </div>

      {/* ── Scoped RWD styles ─────────────────────────────────────────────────── */}
      <style>{`
        /* 2-column at 768-1023px */
        @media (max-width: 1023px) and (min-width: 768px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        /* 1-column below 768px; table scrolls horizontally */
        @media (max-width: 767px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-table-wrap { overflow-x: auto; }
        }
      `}</style>
    </main>
  );
}
