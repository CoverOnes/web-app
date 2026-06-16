/**
 * NetworkPage — 網路人脈 (P4 Network vertical, frontend half)
 *
 * Design reference: design-reference/chat/project/Network.html
 *
 * ── Data-source decision (zero fake data) ──────────────────────────────────────
 * This page is wired to the REAL connections API (GET/POST /api/user/v1/me/
 * connections + /pending + /:id/accept + /:id/decline). Everything rendered with
 * a number or a company name is derived from live API rows — NEVER fabricated.
 *
 * LIVE (real data):
 *   - Page head + 已連結 <N> 位 (N = accepted connections length)
 *   - KPI cards: 已連結 = accepted count, 本月新邀請 = incoming pending count
 *   - Tabs: 已連結 / 受邀請 / 已寄出 with real counts (default 已連結)
 *   - Invite form: send a connection invite by addressee userId (mutation)
 *   - Connections list: avatar / displayName / handle / headline / accountType chip
 *   - Network graph SVG: center node = you, spokes = REAL accepted connections
 *   - Right rail 待處理邀請: incoming invites with 接受 / 忽略 (mutations)
 *
 * DEFER (omitted or empty-state — design showed these but no backend supports
 * them yet, so we render NOTHING fabricated):
 *   - 二度人脈 / 新主動連結 head numbers, 二度人脈 / 產業覆蓋 KPI cards
 *   - 搜尋人脈, 追蹤中 / 封鎖 tabs, conn-filters search/chips
 *   - 引薦 (stargate) banner, strength bars, mutual counts, last-interaction,
 *     查看公司 / 訊息 / 引薦 actions, industry clustering on the graph
 *   - 為你推薦的連結, 人脈動態 (activity feed) right-rail panels
 *
 * Tokens only (var(--co-*)); no raw hex. No dangerouslySetInnerHTML; attacker-
 * controlled avatarUrl is hardened via httpsUrl(). All authed queries gate on
 * auth-ready (the hooks do this internally).
 *
 * RWD:
 *   ≥1440 (≥768 here): grid-template-columns minmax(0,1fr) 320px; graph 320px tall
 *   <768 (375): single column, right rail stacks below, graph simplified
 *     (≤6 nodes, reduced height, grid dots hidden)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getApiErrorCode } from '../lib/api/http';
import { httpsUrl } from '../lib/url';
import { useConnections, usePendingInvites, useSendInvite, useAcceptInvite, useDeclineInvite } from '../lib/query';
import type { Connection, ConnectionUser, PendingInvite } from '../lib/api/coverones';
import Avatar from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';
import { NetworkGraph } from '../components/ui/NetworkGraph';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Tabs (LIVE counts; 追蹤中 / 封鎖 / 總覽-analytics DEFERRED) ─────────────────
type TabId = 'accepted' | 'incoming' | 'outgoing';

// ── Account-type chip label ────────────────────────────────────────────────────
function accountTypeLabel(t: ConnectionUser['accountType']): string {
  return t === 'COMPANY' ? '企業帳號' : '個人帳號';
}

// ── Avatar gradient palette per account type (deterministic, decorative) ────────
function avatarColors(t: ConnectionUser['accountType']): [string, string] {
  return t === 'COMPANY'
    ? ['var(--co-accent-blue)', 'var(--co-accent)']
    : ['var(--co-cyan)', 'var(--co-accent)'];
}

// SVG network graph extracted to components/ui/NetworkGraph.tsx (shared with
// InsightsPage per SA spec §6.5 — single source of truth, no duplication).

// ── KPI stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}
function StatCard({ label, value, valueColor }: StatCardProps) {
  return (
    <div className="net-stat">
      <div className="net-stat-l">{label}</div>
      <div className="net-stat-v" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
    </div>
  );
}

// ── Connection row (accepted list) ───────────────────────────────────────────────
function ConnectionRow({ user }: { user: ConnectionUser }) {
  const safeAvatar = httpsUrl(user.avatarUrl);
  return (
    <div className="net-conn-row">
      <Avatar
        name={user.displayName}
        src={safeAvatar}
        pixelSize={44}
        color={avatarColors(user.accountType)}
      />
      <div className="net-conn-info">
        <div className="net-conn-name">
          {user.displayName}
          {user.handle && <span className="net-conn-handle">@{user.handle}</span>}
          <span className={`net-chip net-chip-${user.accountType === 'COMPANY' ? 'company' : 'personal'}`}>
            {accountTypeLabel(user.accountType)}
          </span>
        </div>
        {user.headline && <div className="net-conn-meta">{user.headline}</div>}
      </div>
    </div>
  );
}

// ── Pending invite row (incoming = actionable; outgoing = read-only) ──────────────
interface InviteRowProps {
  invite: PendingInvite;
  // incoming → render 接受 / 忽略 action buttons; outgoing → 等待回應 status.
  variant: 'incoming' | 'outgoing';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  pending?: boolean;
}
function InviteRow({ invite, variant, onAccept, onDecline, pending }: InviteRowProps) {
  const { user } = invite;
  const safeAvatar = httpsUrl(user.avatarUrl);
  return (
    <div className="net-inv-row">
      <Avatar name={user.displayName} src={safeAvatar} pixelSize={36} color={avatarColors(user.accountType)} />
      <div className="net-inv-body">
        <div className="net-inv-name">
          {user.displayName}
          {variant === 'incoming' ? ' 想連結你' : ''}
        </div>
        {user.headline && <div className="net-inv-msg">{user.headline}</div>}
        {variant === 'incoming' ? (
          <div className="net-inv-btns">
            <button
              type="button"
              className="net-inv-accept"
              disabled={pending}
              onClick={() => onAccept?.(invite.id)}
              aria-label={`接受 ${user.displayName} 的邀請`}
            >
              ＋ 接受
            </button>
            <button
              type="button"
              className="net-inv-decline"
              disabled={pending}
              onClick={() => onDecline?.(invite.id)}
              aria-label={`忽略 ${user.displayName} 的邀請`}
            >
              忽略
            </button>
          </div>
        ) : (
          <div className="net-inv-status">等待回應…</div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NetworkPage
// ════════════════════════════════════════════════════════════════════════════
export default function NetworkPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<TabId>('accepted');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addresseeId, setAddresseeId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState(false);

  const connectionsQuery = useConnections();
  const pendingQuery = usePendingInvites();
  const sendInvite = useSendInvite();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const connections: Connection[] = connectionsQuery.data?.connections ?? [];
  const incoming: PendingInvite[] = pendingQuery.data?.incoming ?? [];
  const outgoing: PendingInvite[] = pendingQuery.data?.outgoing ?? [];

  const acceptedCount = connections.length;
  const incomingCount = incoming.length;
  const outgoingCount = outgoing.length;

  const centerInitial = (me?.displayName ?? 'U').charAt(0).toUpperCase();

  // Map a send-invite error code → inline zh message (per frozen spec).
  const handleSubmitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteOk(false);
    const id = addresseeId.trim();
    if (!id) {
      setInviteError('請輸入對方的使用者 ID。');
      return;
    }
    sendInvite.mutate(id, {
      onSuccess: () => {
        setInviteOk(true);
        setAddresseeId('');
      },
      onError: (err: unknown) => {
        const code = getApiErrorCode(err);
        if (code === 'CONNECTION_EXISTS') {
          setInviteError('已是好友或邀請已存在');
        } else if (code === 'USER_NOT_FOUND') {
          setInviteError('找不到該使用者');
        } else if (code === 'VALIDATION_ERROR') {
          setInviteError('無法連結此使用者（請確認 ID 並避免邀請自己）。');
        } else {
          setInviteError('邀請發送失敗，請稍後再試。');
        }
      },
    });
  };

  // Accept / decline error surfacing (mutation-level; shown inline on the rail).
  const acceptDeclinePending = acceptInvite.isPending || declineInvite.isPending;
  const acceptDeclineError =
    acceptInvite.isError || declineInvite.isError ? '操作失敗，請稍後再試。' : null;

  const isLoading = connectionsQuery.isLoading || pendingQuery.isLoading;
  const isError = connectionsQuery.isError && pendingQuery.isError;

  return (
    <main aria-label="網路人脈" className="net-page">
      {/* ── Page head (LIVE: 已連結 N; 二度人脈/新連結 DEFERRED) ── */}
      <div className="net-head">
        <div className="net-head-row">
          <div className="net-head-info">
            <div className="net-crumb">主選單 / 網路人脈</div>
            <h1 className="net-title">網路人脈 · 你的 B2B 合作網絡</h1>
            <p className="net-desc">
              已連結 <b style={{ color: 'var(--co-text)' }}>{acceptedCount}</b> 位夥伴
            </p>
          </div>
          <div className="net-head-actions">
            <button
              type="button"
              className="net-btn net-btn-primary"
              onClick={() => {
                setInviteOpen((v) => !v);
                setInviteError(null);
                setInviteOk(false);
              }}
              aria-expanded={inviteOpen}
            >
              <Icon.Plus size={14} />
              邀請新連結
            </button>
          </div>
        </div>

        {/* Invite-by-userId form (LIVE; search-by-handle DEFERRED) */}
        {inviteOpen && (
          <form className="net-invite-form" onSubmit={handleSubmitInvite} aria-label="邀請新連結表單">
            <label className="net-invite-label" htmlFor="net-addressee">
              對方使用者 ID
            </label>
            <div className="net-invite-row">
              <input
                id="net-addressee"
                type="text"
                className="net-invite-input"
                value={addresseeId}
                placeholder="貼上對方的 userId（UUID）"
                onChange={(e) => {
                  setAddresseeId(e.target.value);
                  setInviteError(null);
                  setInviteOk(false);
                }}
                autoComplete="off"
              />
              <button type="submit" className="net-btn net-btn-primary" disabled={sendInvite.isPending}>
                {sendInvite.isPending ? '發送中…' : '送出邀請'}
              </button>
            </div>
            {inviteError && (
              <div role="alert" className="net-invite-error">
                {inviteError}
              </div>
            )}
            {inviteOk && (
              <div role="status" className="net-invite-ok">
                邀請已送出，等待對方回應。
              </div>
            )}
          </form>
        )}
      </div>

      {/* ── Tabs (LIVE counts) ── */}
      <div className="net-tabs" role="tablist" aria-label="人脈分類">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'accepted'}
          className={`net-tab${activeTab === 'accepted' ? ' net-tab--on' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          已連結 <span className="net-tab-ct">{acceptedCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'incoming'}
          className={`net-tab${activeTab === 'incoming' ? ' net-tab--on' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          受邀請 <span className="net-tab-ct">{incomingCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'outgoing'}
          className={`net-tab${activeTab === 'outgoing' ? ' net-tab--on' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          已寄出 <span className="net-tab-ct">{outgoingCount}</span>
        </button>
      </div>

      {/* ── Body: 2-column ── */}
      <div className="net-body">
        {/* LEFT */}
        <div className="net-left">
          {/* KPI cards (LIVE: 已連結 + 本月新邀請; 二度人脈/產業覆蓋 DEFERRED) */}
          <div className="net-stats">
            <StatCard label="已連結" value={String(acceptedCount)} valueColor="var(--co-cyan)" />
            <StatCard label="本月新邀請" value={String(incomingCount)} valueColor="var(--co-amber)" />
          </div>

          {/* Network graph (derived from REAL accepted connections) */}
          <div className="net-graph-card">
            <div className="net-graph-h">
              <div className="net-graph-t">
                企業人脈網絡圖
                <span className="net-graph-sub"> — 以你為中心，依直接連結繪製</span>
              </div>
            </div>
            <NetworkGraph centerInitial={centerInitial} connections={connections} cap={isMobile ? 6 : 12} />
          </div>

          {/* Tab content */}
          {isError ? (
            <div role="alert" className="net-error">
              無法載入人脈資料，請重新整理。
            </div>
          ) : isLoading ? (
            <div role="status" className="net-loading">
              載入中…
            </div>
          ) : (
            <div className="net-panel" role="tabpanel">
              {activeTab === 'accepted' && (
                <>
                  <div className="net-panel-h">
                    <h3>已連結的夥伴</h3>
                  </div>
                  {connections.length === 0 ? (
                    <div className="net-empty" role="note">
                      尚無已連結的人脈。送出邀請後，對方接受即會出現在這裡。
                    </div>
                  ) : (
                    connections.map((c) => <ConnectionRow key={c.id} user={c.user} />)
                  )}
                </>
              )}

              {activeTab === 'incoming' && (
                <>
                  <div className="net-panel-h">
                    <h3>收到的邀請</h3>
                  </div>
                  {incoming.length === 0 ? (
                    <div className="net-empty" role="note">
                      目前沒有待處理的邀請。
                    </div>
                  ) : (
                    incoming.map((inv) => (
                      <div className="net-conn-row" key={inv.id}>
                        <InviteRow
                          invite={inv}
                          variant="incoming"
                          onAccept={(id) => acceptInvite.mutate(id)}
                          onDecline={(id) => declineInvite.mutate(id)}
                          pending={acceptDeclinePending}
                        />
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'outgoing' && (
                <>
                  <div className="net-panel-h">
                    <h3>已寄出的邀請</h3>
                  </div>
                  {outgoing.length === 0 ? (
                    <div className="net-empty" role="note">
                      你還沒有寄出任何邀請。
                    </div>
                  ) : (
                    outgoing.map((inv) => (
                      <div className="net-conn-row" key={inv.id}>
                        <InviteRow invite={inv} variant="outgoing" />
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT rail (LIVE: 待處理邀請; 為你推薦/人脈動態 DEFERRED) */}
        <aside className="net-right" aria-label="待處理邀請">
          <div className="net-panel-tight">
            <h3 className="net-rail-h">
              待處理邀請
              <span className="net-rail-badge">{incomingCount}</span>
            </h3>

            {acceptDeclineError && (
              <div role="alert" className="net-invite-error">
                {acceptDeclineError}
              </div>
            )}

            {pendingQuery.isLoading ? (
              <div role="status" className="net-loading">
                載入中…
              </div>
            ) : incoming.length === 0 ? (
              <div className="net-empty" role="note">
                目前沒有待處理的邀請。
              </div>
            ) : (
              incoming.map((inv) => (
                <InviteRow
                  key={inv.id}
                  invite={inv}
                  variant="incoming"
                  onAccept={(id) => acceptInvite.mutate(id)}
                  onDecline={(id) => declineInvite.mutate(id)}
                  pending={acceptDeclinePending}
                />
              ))
            )}
          </div>

          {/* Profile-completion suggestion (no fabricated data; static CTA) */}
          <div className="net-suggest">
            <div className="net-suggest-t">擴展你的人脈</div>
            <div className="net-suggest-d">完善個人檔案，讓更多夥伴找到並連結你。</div>
            <button type="button" className="net-suggest-cta" onClick={() => navigate('/profile')}>
              前往個人檔案 →
            </button>
          </div>
        </aside>
      </div>

      {/* ── Scoped styles (tokens only; RWD 375 + 1440) ── */}
      <style>{`
        .net-page { display: flex; flex-direction: column; min-height: 100%; background: var(--co-bg); color: var(--co-text); }

        .net-head { padding: 24px 28px 0 28px; border-bottom: 1px solid var(--co-line); }
        .net-head-row { display: flex; align-items: flex-start; gap: 16px; padding-bottom: 16px; }
        .net-head-info { flex: 1; min-width: 0; }
        .net-crumb { font-size: 12px; color: var(--co-text-muted); margin-bottom: 6px; }
        .net-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px 0; color: var(--co-text); }
        .net-desc { font-size: 13.5px; color: var(--co-text-dim); margin: 0; }
        .net-head-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }

        .net-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--co-line-strong); background: var(--co-bg-3); color: var(--co-text); }
        .net-btn-primary { background: linear-gradient(135deg, var(--co-accent-blue), var(--co-accent)); border: none; color: var(--co-text-on-accent); }
        .net-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .net-invite-form { padding: 0 0 18px 0; max-width: 520px; }
        .net-invite-label { display: block; font-size: 12px; color: var(--co-text-dim); margin-bottom: 6px; }
        .net-invite-row { display: flex; gap: 8px; }
        .net-invite-input { flex: 1; min-width: 0; padding: 8px 12px; border-radius: 8px; font-size: 13px; background: var(--co-bg-3); border: 1px solid var(--co-line-strong); color: var(--co-text); }
        .net-invite-input::placeholder { color: var(--co-text-muted); }
        .net-invite-error { margin-top: 8px; font-size: 12.5px; color: var(--co-red); }
        .net-invite-ok { margin-top: 8px; font-size: 12.5px; color: var(--co-green); }

        .net-tabs { display: flex; gap: 4px; padding: 12px 28px; border-bottom: 1px solid var(--co-line); overflow-x: auto; }
        .net-tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: var(--co-text-dim); white-space: nowrap; }
        .net-tab--on { background: rgba(99,102,241,0.18); color: var(--co-indigo-lt); }
        .net-tab-ct { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--co-bg-3); color: var(--co-text-dim); font-weight: 600; }
        .net-tab--on .net-tab-ct { background: rgba(99,102,241,0.25); color: var(--co-indigo-lt); }

        .net-body { padding: 22px 28px 40px 28px; display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 22px; align-items: start; max-width: 1280px; width: 100%; margin: 0 auto; box-sizing: border-box; }
        .net-left { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .net-right { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

        .net-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .net-stat { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 12px; padding: 14px 16px; }
        .net-stat-l { font-size: 11px; color: var(--co-text-dim); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
        .net-stat-v { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-top: 4px; color: var(--co-text); }

        .net-graph-card { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 14px; padding: 18px; position: relative; overflow: hidden; }
        .net-graph-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .net-graph-t { font-size: 14px; font-weight: 600; color: var(--co-text); }
        .net-graph-sub { color: var(--co-text-dim); font-weight: 400; font-size: 12.5px; }
        .net-graph-svg { width: 100%; height: 320px; display: block; }

        .net-panel { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 12px; }
        .net-panel-h { padding: 14px 16px; border-bottom: 1px solid var(--co-line); display: flex; align-items: center; justify-content: space-between; }
        .net-panel-h h3 { font-size: 14px; font-weight: 600; margin: 0; color: var(--co-text); }

        .net-conn-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--co-line); }
        .net-conn-row:last-child { border-bottom: none; }
        .net-conn-info { flex: 1; min-width: 0; }
        .net-conn-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; color: var(--co-text); }
        .net-conn-handle { font-size: 12px; font-weight: 400; color: var(--co-text-dim); }
        .net-conn-meta { font-size: 12px; color: var(--co-text-dim); margin-top: 3px; }
        .net-chip { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 500; }
        .net-chip-company { background: rgba(99,102,241,0.15); color: var(--co-indigo-lt); border: 1px solid rgba(99,102,241,0.3); }
        .net-chip-personal { background: rgba(34,211,238,0.15); color: var(--co-cyan); border: 1px solid rgba(34,211,238,0.3); }

        .net-panel-tight { background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 12px; padding: 16px; }
        .net-rail-h { font-size: 13px; font-weight: 600; margin: 0 0 12px 0; display: flex; justify-content: space-between; align-items: center; color: var(--co-text); }
        .net-rail-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--co-red); color: var(--co-text-on-accent); font-weight: 600; }

        .net-inv-row { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--co-line); align-items: flex-start; }
        .net-inv-row:last-child { border-bottom: none; padding-bottom: 0; }
        .net-inv-row:first-of-type { padding-top: 0; }
        .net-inv-body { flex: 1; min-width: 0; }
        .net-inv-name { font-size: 12.5px; font-weight: 600; color: var(--co-text); }
        .net-inv-msg { font-size: 11px; color: var(--co-text-dim); margin-top: 2px; line-height: 1.4; }
        .net-inv-status { font-size: 11px; color: var(--co-text-muted); margin-top: 6px; }
        .net-inv-btns { display: flex; gap: 4px; margin-top: 6px; }
        .net-inv-accept { padding: 4px 10px; border-radius: 6px; background: var(--co-accent); color: var(--co-text-on-accent); font-size: 11px; font-weight: 600; border: none; cursor: pointer; }
        .net-inv-accept:disabled { opacity: 0.6; cursor: not-allowed; }
        .net-inv-decline { padding: 4px 10px; border-radius: 6px; background: var(--co-bg-3); border: 1px solid var(--co-line-strong); color: var(--co-text-dim); font-size: 11px; cursor: pointer; }
        .net-inv-decline:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Right-rail invites use the tight panel spacing, not conn-row dividers */
        .net-right .net-conn-row { padding: 0; border-bottom: none; }

        .net-suggest { background: linear-gradient(135deg, var(--co-suggest-bg-from), var(--co-suggest-bg-to)); border: 1px solid var(--co-suggest-border); border-radius: 12px; padding: 16px; }
        .net-suggest-t { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--co-text); }
        .net-suggest-d { font-size: 12px; color: var(--co-text-dim); line-height: 1.5; margin-bottom: 12px; }
        .net-suggest-cta { width: 100%; display: flex; align-items: center; justify-content: center; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; background: linear-gradient(135deg, var(--co-accent-blue), var(--co-accent)); color: var(--co-text-on-accent); border: none; cursor: pointer; box-shadow: 0 4px 12px var(--co-suggest-shadow); }

        .net-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: var(--co-text-dim); }
        .net-loading { padding: 24px 16px; text-align: center; font-size: 13px; color: var(--co-text-dim); }
        .net-error { padding: 20px 16px; font-size: 13px; color: var(--co-red); background: var(--co-bg-card); border: 1px solid var(--co-line-strong); border-radius: 12px; }

        /* ── RWD: 375 single column, graph simplified ── */
        @media (max-width: 767px) {
          .net-head { padding: 16px 16px 0 16px; }
          .net-tabs { padding: 12px 16px; }
          .net-body { grid-template-columns: 1fr; padding: 16px; gap: 16px; }
          .net-stats { grid-template-columns: repeat(2, 1fr); }
          .net-graph-svg { height: 220px; }
          .net-title { font-size: 20px; }
        }
      `}</style>
    </main>
  );
}
