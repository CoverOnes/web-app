import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: '📌 最常見問題',
    items: [
      {
        q: '如何發布專案 / 招標需求？',
        a: '登入後從首頁點「＋ 發布專案」，依序填寫專案類型（接案 / 招標 / 合作）、需求說明、預算範圍、截止日期。送出後系統會自動配對 5–8 家最匹配的供應商，一般在 24 小時內收到第一份提案。',
      },
      {
        q: '公司認證需要什麼文件？',
        a: '需要：營業登記證影本、負責人身分證、公司營業地址證明（水電帳單或租約）。一般 2 個工作天內完成審核。',
      },
      {
        q: '付款流程與履約保證如何運作？',
        a: '採用第三方履約保證。採購方在合約簽訂後將款項預存平台，依里程碑分階段撥款給供應商。爭議時可申請仲裁。',
      },
      {
        q: 'PRO 會員與免費版的差別？',
        a: 'PRO 享：無限報告下載、提前 7 天看到新報告、進階搜尋與篩選、優先客服、客製簡報。NT$ 1,580 / 月，年付 8 折。',
      },
      {
        q: '如何拿到「實名認證」徽章？',
        a: '完成：1) 公司認證、2) 手機 OTP 驗證、3) 視訊面談（5 分鐘）、4) 至少完成 1 件交易並獲評價。一般可於 1 週內取得。',
      },
    ],
  },
  {
    title: '💼 專案與接案',
    items: [
      {
        q: '提案後對方多久回覆？',
        a: '平均 2.4 天。系統會在 7 天無回覆時自動發送提醒。如需加急，可使用「優先標記」功能。',
      },
      {
        q: '沒有合作機會的專案會發生什麼？',
        a: '系統會在 30 天無進展時自動標記為「冷卻中」並發送回收通知。可選擇延長、修改條件，或關閉。',
      },
      {
        q: '如何處理合約糾紛？',
        a: '透過「申請仲裁」功能，提交證據與訴求。平台仲裁團隊會在 5 個工作天內介入處理，必要時轉介法律顧問。',
      },
    ],
  },
  {
    title: '🔒 帳號與安全',
    items: [
      {
        q: '忘記密碼怎麼辦？',
        a: '至登入頁點「忘記密碼」，輸入註冊 Email，10 分鐘內會收到重設信。',
      },
      {
        q: '如何啟用兩步驟驗證？',
        a: '設定 → 安全 → 兩步驟驗證，支援 Google Authenticator / Authy / 簡訊。',
      },
    ],
  },
];

const CATEGORIES = [
  { icon: '🚀', label: '入門指南', count: '12 篇文章', colorClass: 'cat-a' },
  { icon: '🏢', label: '公司管理', count: '18 篇文章', colorClass: 'cat-b' },
  { icon: '💼', label: '專案 / 接案', count: '24 篇文章', colorClass: 'cat-c' },
  { icon: '📋', label: '招標流程', count: '15 篇文章', colorClass: 'cat-d' },
  { icon: '💬', label: '訊息與洽談', count: '9 篇文章', colorClass: 'cat-e' },
  { icon: '💰', label: '付款與發票', count: '14 篇文章', colorClass: 'cat-f' },
  { icon: '🔒', label: '帳號安全', count: '11 篇文章', colorClass: 'cat-g' },
  { icon: '⚙️', label: 'API / 整合', count: '7 篇文章', colorClass: 'cat-h' },
];

const POPULAR_ARTICLES = [
  '新手快速上手指南（10 分鐘）',
  '如何寫出高轉換率的提案？',
  '履約保證機制完整說明',
  '專案範本下載：RFP / NDA',
  'API 串接 Step-by-step',
];

const QUICK_SEARCHES = ['如何發布專案？', '付款與退費', '公司認證流程', 'API 文件'];

interface AccordionItemProps {
  item: FaqItem;
  defaultOpen?: boolean;
}

function AccordionItem({ item, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid var(--co-line)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'var(--co-text)',
          fontSize: 13.5,
          fontWeight: 600,
          textAlign: 'left',
          gap: 12,
        }}
      >
        <span>{item.q}</span>
        <span
          aria-hidden="true"
          style={{
            fontSize: 14,
            color: 'var(--co-text-muted)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--co-text-dim)',
            lineHeight: 1.7,
            paddingTop: 8,
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  );
}

interface FaqSectionCardProps {
  section: FaqSection;
  firstOpen?: boolean;
}

function FaqSectionCard({ section, firstOpen = false }: FaqSectionCardProps) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 13,
        padding: '6px 22px',
        marginBottom: 14,
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: '18px 0 12px',
          paddingBottom: 11,
          borderBottom: '1px solid var(--co-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--co-text)',
        }}
      >
        {section.title}
      </h2>
      {section.items.map((item, i) => (
        <AccordionItem key={item.q} item={item} defaultOpen={firstOpen && i === 0} />
      ))}
    </div>
  );
}

const catIconColors: Record<string, { bg: string; color: string }> = {
  'cat-a': { bg: 'rgba(99,102,241,0.18)', color: '#A78BFA' },
  'cat-b': { bg: 'rgba(34,211,238,0.18)', color: '#67E8F9' },
  'cat-c': { bg: 'rgba(245,158,11,0.18)', color: '#FCD34D' },
  'cat-d': { bg: 'rgba(16,185,129,0.18)', color: '#6EE7B7' },
  'cat-e': { bg: 'rgba(236,72,153,0.18)', color: '#F9A8D4' },
  'cat-f': { bg: 'rgba(239,68,68,0.18)', color: '#FCA5A5' },
  'cat-g': { bg: 'rgba(168,85,247,0.18)', color: '#D8B4FE' },
  'cat-h': { bg: 'rgba(59,130,246,0.18)', color: '#93C5FD' },
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div
      style={{
        padding: '24px 28px',
        color: 'var(--co-text)',
        fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
        maxWidth: 1440,
        margin: '0 auto',
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg,#312E81,#6366F1)',
          borderRadius: 16,
          padding: '36px 40px',
          marginBottom: 18,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,.15),transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <h1
          style={{
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            position: 'relative',
          }}
        >
          ChatOwl 幫助中心
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,.8)',
            margin: '0 0 18px',
            position: 'relative',
          }}
        >
          快速找到答案，或聯絡我們的客服團隊。
        </p>
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 15,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,.6)',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="search"
            placeholder="搜尋說明文件、常見問題、教學..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜尋幫助中心"
            style={{
              width: '100%',
              padding: '13px 18px 13px 44px',
              background: 'rgba(0,0,0,.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,.25)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          {QUICK_SEARCHES.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setSearchQuery(q)}
              style={{
                padding: '5px 12px',
                background: 'rgba(255,255,255,.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: 999,
                fontSize: 12,
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {CATEGORIES.map((cat) => {
          const colors = catIconColors[cat.colorClass];
          return (
            <button
              type="button"
              key={cat.label}
              aria-label={cat.label}
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 13,
                padding: 20,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 200ms',
                color: 'var(--co-text)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(99,102,241,.4)';
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--co-line-strong)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  marginBottom: 11,
                  background: colors.bg,
                  color: colors.color,
                }}
              >
                {cat.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--co-text-dim)',
                  marginTop: 3,
                }}
              >
                {cat.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main layout: FAQ + Sidebar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
          gap: 18,
        }}
        className="help-layout"
      >
        {/* FAQ column */}
        <div>
          {FAQ_SECTIONS.map((section, i) => (
            <FaqSectionCard key={section.title} section={section} firstOpen={i === 0} />
          ))}
        </div>

        {/* Sidebar */}
        <div>
          {/* Popular articles */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 13,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                margin: '0 0 12px',
                color: 'var(--co-text)',
              }}
            >
              🔥 熱門文章
            </h3>
            {POPULAR_ARTICLES.map((article, i) => (
              <div
                key={article}
                style={{
                  display: 'flex',
                  gap: 9,
                  padding: '8px 0',
                  borderTop: i > 0 ? '1px solid var(--co-line)' : 'none',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  color: 'var(--co-text)',
                }}
              >
                <span
                  style={{
                    color: 'var(--co-text-muted)',
                    fontWeight: 700,
                    width: 18,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span>{article}</span>
              </div>
            ))}
          </div>

          {/* Contact support card */}
          <div
            style={{
              background:
                'linear-gradient(135deg,rgba(34,211,238,.1),rgba(99,102,241,.05))',
              border: '1px solid rgba(34,211,238,.3)',
              borderRadius: 13,
              padding: 18,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                margin: '0 0 12px',
                color: '#67E8F9',
              }}
            >
              💬 還沒找到答案？
            </h3>
            {[
              {
                icon: '💬',
                label: '即時客服',
                value: '週一至五 09:00–22:00',
              },
              { icon: '📧', label: 'Email', value: 'support@chatowl.tw' },
              { icon: '📞', label: '電話', value: '02-2789-1234' },
              { icon: '🎓', label: '線上課程', value: '每月 8 場直播' },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderTop:
                    i > 0 ? '1px solid rgba(34,211,238,.18)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(34,211,238,.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--co-text)' }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RWD: stack columns on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .help-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

