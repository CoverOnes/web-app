/**
 * InsightsPage — 數據洞察 (P4 Reports + Insights vertical, frontend-only)
 *
 * Design reference: design-reference/chat/project/Insights.html
 *
 * ── Data-source decision (ZERO fake data) ──────────────────────────────────────
 * The mockup is saturated with fabricated analytics (NT$18.4M 總媒合金額,
 * 中標率 28.6%, 公司頁瀏覽 3,128, 12-month trend bars, 7×24 heatmap, AI 洞察
 * NT$8.4M / +38% …). NONE of these have a backing data source in the `user`
 * service today (no money/bid/view/RFP-event table; baseline §1.1 of the SA
 * spec). The ONLY real aggregatable per-user data is the connections table.
 *
 * LIVE (real data, derived client-side exactly as NetworkPage does):
 *   - KPI: 已連結 = accepted-connections count (connectionApi.list().length)
 *   - KPI: 待處理邀請 = incoming-pending count (connectionApi.listPending().incoming.length)
 *   - Network graph (inline SVG): center = you, spokes = REAL accepted connections
 *     (NetworkGraph component reused from NetworkPage). n=0 → "尚無連結".
 *
 * EMPTY-STATE (panel frame + heading kept for layout fidelity; NO fabricated
 * numbers, NO CSS bars, NO heatmap cells — rendering them would be fake data):
 *   - 招標金額趨勢 12-month bar chart, 產業熱度排行, 投標活動熱力圖
 *   - Network side-panel 熱度排行 (案 counts) → empty-state
 *
 * DEFER (dropped or rendered inert):
 *   - 媒合度評分 KPI (ML scoring, no source) — dropped
 *   - 3 other mockup KPI slots (金額/投標/中標/瀏覽) — dropped (2 real cards only)
 *   - AI 洞察建議 panel — replaced with a single number-free static CTA card
 *   - Date-range / 匯出報表 / 分享 controls — rendered disabled (title="即將推出")
 *   - "BUSINESS PRO" badge — rendered as a neutral static label, no entitlement
 *
 * Tokens only (var(--co-*)); no raw hex. No dangerouslySetInnerHTML; any
 * connection avatarUrl/displayName is the PII-safe projection and the graph
 * renders only an initial. All authed reads gate on auth-ready (hooks do this).
 *
 * RWD:
 *   ≥768: KPI row 2-col; main grid 2fr/1fr; trends grid 3-col
 *   <768 (375): everything stacks to a single column; graph height reduced
 */

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useConnections, usePendingInvites } from '../lib/query';
import type { Connection, PendingInvite } from '../lib/api/coverones';
import { NetworkGraph } from '../components/ui/NetworkGraph';
import { useIsMobile } from '../hooks/useIsMobile';

// ── KPI stat card (mirrors NetworkPage StatCard) ─────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  valueColor?: string;
}
function KpiCard({ label, value, valueColor }: KpiCardProps) {
  return (
    <div className="ins-kpi">
      <div className="ins-kpi-l">{label}</div>
      <div className="ins-kpi-v" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
    </div>
  );
}

// ── Empty-state panel body (heading kept; content honest) ────────────────────────
function PanelEmpty({ title }: { title: string }) {
  return (
    <div className="ins-empty" role="note">
      {title}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// InsightsPage
// ════════════════════════════════════════════════════════════════════════════
export default function InsightsPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const connectionsQuery = useConnections();
  const pendingQuery = usePendingInvites();

  const connections: Connection[] = connectionsQuery.data?.connections ?? [];
  const incoming: PendingInvite[] = pendingQuery.data?.incoming ?? [];

  // REAL counts — identical derivation to NetworkPage (acceptedCount/incomingCount).
  const acceptedCount = connections.length;
  const incomingCount = incoming.length;

  const centerInitial = (me?.displayName ?? 'U').charAt(0).toUpperCase();

  return (
    <main aria-label="數據洞察" className="ins-page">
      {/* ── Page head (LIVE: title; numbers/PRO entitlement DEFERRED) ── */}
      <div className="ins-head">
        <div className="ins-head-info">
          <div className="ins-crumb">主選單 / 數據洞察</div>
          <h1 className="ins-title">
            數據洞察
            <span className="ins-badge">商業分析</span>
          </h1>
          <p className="ins-desc">你的人脈與連結概況。更多分析功能開發中。</p>
        </div>
        <div className="ins-head-actions">
          <button type="button" className="ins-btn" disabled title="即將推出">
            日期範圍
          </button>
          <button type="button" className="ins-btn" disabled title="即將推出">
            匯出報表
          </button>
          <button type="button" className="ins-btn" disabled title="即將推出">
            分享
          </button>
        </div>
      </div>

      <div className="ins-body">
        {/* ── Top KPI row — exactly 2 REAL cards ── */}
        <div className="ins-kpis">
          <KpiCard label="已連結" value={String(acceptedCount)} valueColor="var(--co-cyan)" />
          <KpiCard label="待處理邀請" value={String(incomingCount)} valueColor="var(--co-amber)" />
        </div>

        {/* ── Network + suggestion row (graph LIVE; AI 洞察 → static CTA) ── */}
        <div className="ins-grid-2">
          {/* Network graph (derived from REAL accepted connections) */}
          <div className="ins-panel ins-net-panel">
            <div className="ins-panel-h">
              <div>
                <h2 className="ins-panel-t">企業關係網絡圖</h2>
                <div className="ins-panel-sub">以你為中心，依直接連結繪製</div>
              </div>
            </div>
            <div className="ins-net-canvas">
              <NetworkGraph centerInitial={centerInitial} connections={connections} cap={isMobile ? 6 : 12} />
            </div>
            {/* Side panel 熱度排行 → empty-state (案 counts have no source) */}
            <div className="ins-net-foot">
              <PanelEmpty title="尚無足夠資料以排序熱度" />
            </div>
          </div>

          {/* AI 洞察 → single number-free static CTA (no fabricated NT$/%) */}
          <div className="ins-panel ins-suggest">
            <div className="ins-suggest-t">完善檔案以獲得洞察</div>
            <div className="ins-suggest-d">
              連結更多夥伴並完善個人 / 公司檔案後，這裡將提供以你的人脈為基礎的洞察建議。
            </div>
            <button type="button" className="ins-suggest-cta" onClick={() => navigate('/network')}>
              前往網路人脈 →
            </button>
          </div>
        </div>

        {/* ── Trends row — 3 panel frames, all honest empty-states ── */}
        <div className="ins-grid-3">
          <div className="ins-panel">
            <div className="ins-panel-h">
              <h2 className="ins-panel-t">招標金額趨勢</h2>
            </div>
            <PanelEmpty title="尚無足夠資料以繪製趨勢" />
          </div>

          <div className="ins-panel">
            <div className="ins-panel-h">
              <h2 className="ins-panel-t">產業熱度排行</h2>
            </div>
            <PanelEmpty title="尚無足夠資料" />
          </div>

          <div className="ins-panel">
            <div className="ins-panel-h">
              <h2 className="ins-panel-t">投標活動熱力圖</h2>
            </div>
            <PanelEmpty title="尚無足夠資料" />
          </div>
        </div>
      </div>

      {/* ── Scoped styles (tokens only; RWD 375 + 1440) ── */}
      <style>{`
        .ins-page { display: flex; flex-direction: column; min-height: 100%; background: var(--co-bg); color: var(--co-text); }

        .ins-head { padding: 24px 28px 18px 28px; border-bottom: 1px solid var(--co-line); display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .ins-head-info { flex: 1; min-width: 0; }
        .ins-crumb { font-size: 12px; color: var(--co-text-muted); margin-bottom: 6px; }
        .ins-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; color: var(--co-text); display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .ins-badge { font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: rgba(34,211,238,0.15); color: var(--co-cyan); border: 1px solid rgba(34,211,238,0.3); }
        .ins-desc { font-size: 13.5px; color: var(--co-text-dim); margin: 0; }
        .ins-head-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }

        .ins-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid var(--co-line-strong); background: var(--co-bg-3); color: var(--co-text-dim); cursor: not-allowed; opacity: 0.6; }

        .ins-body { padding: 22px 28px 40px 28px; max-width: 1280px; width: 100%; margin: 0 auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; }

        .ins-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .ins-kpi { background: linear-gradient(180deg, var(--co-bg-card), var(--co-bg-card-2)); border: 1px solid var(--co-line-strong); border-radius: 14px; padding: 18px; position: relative; overflow: hidden; }
        .ins-kpi-l { font-size: 11px; color: var(--co-text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
        .ins-kpi-v { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-top: 6px; color: var(--co-text); }

        .ins-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; align-items: start; }
        .ins-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; align-items: start; }

        .ins-panel { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 14px; padding: 20px; min-width: 0; }
        .ins-panel-h { margin-bottom: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .ins-panel-t { font-size: 14px; font-weight: 600; margin: 0; color: var(--co-text); }
        .ins-panel-sub { font-size: 11.5px; color: var(--co-text-dim); margin-top: 4px; }

        .ins-net-panel { padding: 0; overflow: hidden; }
        .ins-net-panel .ins-panel-h { padding: 18px 20px 14px; border-bottom: 1px solid var(--co-line); margin-bottom: 0; }
        .ins-net-canvas { padding: 14px 18px; background: radial-gradient(circle at 50% 50%, var(--co-bg-3), var(--co-bg)); }
        .ins-net-canvas .net-graph-svg { width: 100%; height: 360px; display: block; }
        .ins-net-foot { padding: 0 18px 8px; border-top: 1px solid var(--co-line); }

        .ins-suggest { display: flex; flex-direction: column; background: linear-gradient(135deg, var(--co-suggest-bg-from), var(--co-suggest-bg-to)); border: 1px solid var(--co-suggest-border); }
        .ins-suggest-t { font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--co-text); }
        .ins-suggest-d { font-size: 12.5px; color: var(--co-text-dim); line-height: 1.6; margin-bottom: 14px; }
        .ins-suggest-cta { width: 100%; display: flex; align-items: center; justify-content: center; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; background: linear-gradient(135deg, var(--co-accent-blue), var(--co-accent)); color: var(--co-text-on-accent); border: none; cursor: pointer; box-shadow: 0 4px 12px var(--co-suggest-shadow); margin-top: auto; }

        .ins-empty { padding: 40px 16px; text-align: center; font-size: 13px; color: var(--co-text-dim); }

        /* ── RWD: <768 single column ── */
        @media (max-width: 767px) {
          .ins-head { padding: 16px 16px 14px 16px; }
          .ins-body { padding: 16px; gap: 16px; }
          .ins-title { font-size: 20px; }
          .ins-kpis { grid-template-columns: repeat(2, 1fr); }
          .ins-grid-2, .ins-grid-3 { grid-template-columns: 1fr; }
          .ins-net-canvas .net-graph-svg { height: 240px; }
        }
      `}</style>
    </main>
  );
}
