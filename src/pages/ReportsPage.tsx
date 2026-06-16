/**
 * ReportsPage — 產業報告 (P4 Reports + Insights vertical, frontend-only)
 *
 * Design reference: design-reference/chat/project/Reports.html
 *
 * ── Data-source decision (ZERO fake data) ──────────────────────────────────────
 * The mockup shows a flagship report, a 6-card report grid, a 本週熱門 ranking,
 * a 平台數據 panel (428 報告 / +42 / 182K 下載 / 12/42 已讀) and a PRO upsell
 * (NT$1,580/月). There is NO reports-content table anywhere in the backend
 * (SA spec baseline §1.1) and NO subscription/PRO/billing system. So the page
 * is an honest empty-state + tier-gated upsell shell.
 *
 * LIVE (real data):
 *   - PRO-upsell visibility is gated on the user's REAL KYC tier
 *     (useAuthStore().user.kycTier). kycTier < 2 → show upsell; >= 2 → entitled.
 *     This is the ONLY real per-user signal on the page (RD-1). The KYC tier is
 *     a proxy for "PRO" because no plan/subscription field exists.
 *
 * EMPTY-STATE (frame kept for layout fidelity; NO fabricated numbers/rows):
 *   - Hero 精選報告 → "尚無精選報告"
 *   - Report grid → single centered "尚無產業報告" (NOT 6 fake cards)
 *   - 本週熱門 ranking + 平台數據 → empty-state (no 428/182K/12/42 etc.)
 *
 * DEFER (rendered inert for layout fidelity):
 *   - 訂閱週報 / 我的下載 / 進階篩選 actions — disabled (title="即將推出")
 *   - Filter chips — rendered inert (no filtering backend)
 *   - PRO purchase CTA — disabled (no billing backend, RD-2). Visible only as
 *     an upsell affordance; performs no checkout.
 *
 * Tokens only (var(--co-*)); no raw hex. No dangerouslySetInnerHTML.
 *
 * RWD:
 *   ≥768: two-column layout (1fr content + 320px right rail)
 *   <768 (375): single column, right rail stacks below, chips scroll horizontally
 */

import { useAuthStore } from '../store/authStore';
import { EmptyState } from '../components/ui/EmptyState';

// PRO proxy threshold (RD-1): KYC tier >= 2 is treated as "entitled".
const PRO_TIER_THRESHOLD = 2;

// Inert filter chips — layout fidelity only (no filtering backend).
const FILTER_CHIPS = ['全部', '金融科技', 'AI / LLM', '製造業', '零售 / 電商', '醫療生技', '能源', '物流', '教育'];

// Inert head actions (no backend) — rendered disabled.
const HEAD_ACTIONS = ['訂閱週報', '我的下載', '進階篩選'];

// ── Document empty-state icon ────────────────────────────────────────────────────
const ReportIcon = () => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  // kycTier is the only real per-user tier signal (RD-1). Default 0 (lowest).
  const kycTier = user?.kycTier ?? 0;
  const isEntitled = kycTier >= PRO_TIER_THRESHOLD;

  return (
    <main aria-label="產業報告" className="rep-page">
      {/* ── Page head (LIVE: title; "本月共 42 篇" count DEFERRED/removed) ── */}
      <div className="rep-head">
        <div className="rep-head-info">
          <div className="rep-crumb">主選單 / 產業報告</div>
          <h1 className="rep-title">產業報告</h1>
          <p className="rep-desc">產業洞察、市場趨勢與競爭分析。報告內容功能即將推出。</p>
        </div>
        <div className="rep-head-actions">
          {HEAD_ACTIONS.map((label) => (
            <button key={label} type="button" className="rep-btn" disabled title="即將推出">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter chips (inert — layout fidelity only) ── */}
      <div className="rep-filters" aria-label="報告分類（即將推出）">
        {FILTER_CHIPS.map((chip, i) => (
          <span key={chip} className={`rep-chip${i === 0 ? ' rep-chip--on' : ''}`} aria-disabled="true">
            {chip}
          </span>
        ))}
      </div>

      {/* ── Body: 2-column ── */}
      <div className="rep-body">
        {/* LEFT */}
        <div className="rep-left">
          {/* Hero 精選報告 → empty-state inside the hero frame */}
          <div className="rep-hero">
            <EmptyState
              title="尚無精選報告"
              description="精選報告功能即將推出，敬請期待。"
            />
          </div>

          {/* Report grid → single centered empty-state (NOT 6 fake cards) */}
          <div className="rep-grid-empty" aria-label="報告清單">
            <EmptyState
              icon={<ReportIcon />}
              title="尚無產業報告"
              description="產業報告功能即將推出。後端報告內容服務上線後，此處將顯示可瀏覽與下載的報告。"
            />
          </div>
        </div>

        {/* RIGHT rail */}
        <aside className="rep-right" aria-label="報告輔助資訊">
          {/* 本週熱門 → empty-state (no downloads/popularity source) */}
          <div className="rep-side">
            <h3 className="rep-side-h">本週熱門</h3>
            <div className="rep-empty" role="note">尚無熱門報告</div>
          </div>

          {/* 平台數據 → empty-state (all mockup counts fabricated) */}
          <div className="rep-side">
            <h3 className="rep-side-h">平台數據</h3>
            <div className="rep-empty" role="note">尚無平台數據</div>
          </div>

          {/* PRO upsell — visibility gated on REAL KYC tier (RD-1).
              CTA is inert (no billing backend, RD-2). */}
          {isEntitled ? (
            <div className="rep-side rep-entitled">
              <h3 className="rep-side-h rep-entitled-h">已是進階會員</h3>
              <p className="rep-side-p">你的帳號已通過進階身分認證，未來進階報告功能上線後將自動解鎖。</p>
            </div>
          ) : (
            <div className="rep-side rep-pro">
              <h3 className="rep-side-h rep-pro-h">升級進階會員</h3>
              <p className="rep-side-p">完成進階身分認證後，未來可解鎖更多產業報告與洞察功能。</p>
              <button type="button" className="rep-pro-cta" disabled title="即將推出">
                升級方案即將推出
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ── Scoped styles (tokens only; RWD 375 + 1440) ── */}
      <style>{`
        .rep-page { display: flex; flex-direction: column; min-height: 100%; background: var(--co-bg); color: var(--co-text); }

        .rep-head { padding: 24px 28px 16px 28px; border-bottom: 1px solid var(--co-line); display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .rep-head-info { flex: 1; min-width: 0; }
        .rep-crumb { font-size: 12px; color: var(--co-text-muted); margin-bottom: 6px; }
        .rep-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; color: var(--co-text); }
        .rep-desc { font-size: 13.5px; color: var(--co-text-dim); margin: 0; }
        .rep-head-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }
        .rep-btn { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid var(--co-line-strong); background: var(--co-bg-3); color: var(--co-text-dim); cursor: not-allowed; opacity: 0.6; }

        .rep-filters { display: flex; gap: 8px; padding: 14px 28px; border-bottom: 1px solid var(--co-line); flex-wrap: wrap; overflow-x: auto; }
        .rep-chip { padding: 7px 14px; font-size: 12.5px; background: var(--co-bg-3); border: 1px solid var(--co-line-strong); border-radius: 999px; color: var(--co-text-dim); white-space: nowrap; cursor: default; opacity: 0.7; }
        .rep-chip--on { background: rgba(99,102,241,0.18); border-color: rgba(99,102,241,0.5); color: var(--co-indigo-lt); font-weight: 600; opacity: 1; }

        .rep-body { padding: 22px 28px 40px 28px; display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 18px; align-items: start; max-width: 1280px; width: 100%; margin: 0 auto; box-sizing: border-box; }
        .rep-left { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .rep-right { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

        .rep-hero { background: linear-gradient(135deg, var(--co-bg-card), var(--co-bg-card-2)); border: 1px solid var(--co-line-strong); border-radius: 14px; min-height: 180px; display: flex; align-items: center; justify-content: center; }
        .rep-grid-empty { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 13px; min-height: 300px; display: flex; align-items: center; justify-content: center; }

        .rep-side { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 13px; padding: 18px; }
        .rep-side-h { font-size: 13px; font-weight: 700; margin: 0 0 12px 0; color: var(--co-text); }
        .rep-side-p { font-size: 12px; color: var(--co-text-dim); line-height: 1.6; margin: 0 0 12px 0; }
        .rep-empty { padding: 24px 8px; text-align: center; font-size: 12.5px; color: var(--co-text-dim); }

        .rep-pro { background: linear-gradient(135deg, var(--co-suggest-bg-from), var(--co-suggest-bg-to)); border: 1px solid var(--co-suggest-border); }
        .rep-pro-h { color: var(--co-amber); }
        .rep-pro-cta { width: 100%; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; background: var(--co-bg-3); border: 1px solid var(--co-line-strong); color: var(--co-text-dim); cursor: not-allowed; opacity: 0.65; }
        .rep-entitled { background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.3); }
        .rep-entitled-h { color: var(--co-cyan); }

        /* ── RWD: 375 single column ── */
        @media (max-width: 767px) {
          .rep-head { padding: 16px 16px 14px 16px; }
          .rep-filters { padding: 12px 16px; }
          .rep-body { grid-template-columns: 1fr; padding: 16px; gap: 16px; }
          .rep-title { font-size: 20px; }
        }
      `}</style>
    </main>
  );
}
