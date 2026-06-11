import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api/coverones';
import type { OAuthProvider, ListIdentitiesResponse } from '../lib/api/coverones';
import { getApiErrorCode } from '../lib/api/http';
import './Settings.css';

// ─── Provider display helpers ─────────────────────────────────────────────────

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  line: 'LINE',
};

const PROVIDERS: OAuthProvider[] = ['google', 'line'];

// ─── LinkedAccounts section ───────────────────────────────────────────────────

const LinkedAccounts = () => {
  const qc = useQueryClient();
  const [unbindError, setUnbindError] = React.useState<string | null>(null);
  const [bindError, setBindError] = React.useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ListIdentitiesResponse>({
    queryKey: ['me', 'identities'],
    queryFn: () => authApi.listIdentities(),
  });

  const unbind = useMutation<unknown, Error, OAuthProvider>({
    mutationFn: (provider) => authApi.unbindIdentity(provider) as Promise<unknown>,
    onSuccess: () => {
      setUnbindError(null);
      qc.invalidateQueries({ queryKey: ['me', 'identities'] });
    },
    onError: (err: unknown) => {
      // 409 LAST_LOGIN_METHOD = backend guard (belt-and-suspenders over the FE guard).
      const code = getApiErrorCode(err);
      if (code === 'LAST_LOGIN_METHOD') {
        setUnbindError('無法解除：此為唯一登入方式。');
      } else if (code === 'UNAUTHORIZED' || (err instanceof Error && err.message.includes('401'))) {
        setUnbindError('未授權，請重新登入後再試。');
      } else {
        setUnbindError('解除綁定失敗，請稍後再試。');
      }
    },
  });

  const identities = data?.identities ?? [];
  const hasPassword = data?.hasPassword ?? false;
  const boundProviders = new Set(identities.map((id) => id.provider));

  // A user can unbind a social identity only when they have another login method:
  // either another bound provider OR a password. "Last method" = no password AND
  // only 1 social identity.
  const isLastMethod = identities.length <= 1 && !hasPassword;

  const handleUnbind = (provider: OAuthProvider) => {
    setUnbindError(null);
    unbind.mutate(provider);
  };

  const handleBind = (provider: OAuthProvider) => {
    setBindError(null);
    authApi.bindIdentity(provider).catch(() => {
      setBindError('無法啟動綁定流程，請稍後再試。');
    });
  };

  if (isLoading) {
    return (
      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-description">載入中…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="setting-item">
        <div className="setting-info">
          <div
            className="setting-description"
            role="alert"
            style={{ color: 'var(--co-error, #FCA5A5)' }}
          >
            無法載入登入方式，請重新整理頁面。
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Unbind error banner */}
      {unbindError && (
        <div
          role="alert"
          aria-live="polite"
          className="setting-item"
          style={{
            color: 'var(--co-error, #FCA5A5)',
            fontSize: 13,
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {unbindError}
        </div>
      )}

      {/* Bind error banner */}
      {bindError && (
        <div
          role="alert"
          aria-live="polite"
          className="setting-item"
          style={{
            color: 'var(--co-error, #FCA5A5)',
            fontSize: 13,
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {bindError}
        </div>
      )}

      {PROVIDERS.map((provider) => {
        const isBound = boundProviders.has(provider);
        const label = PROVIDER_LABEL[provider];
        const isPending = unbind.isPending && unbind.variables === provider;
        const cannotUnbind = isLastMethod;

        return (
          <div key={provider} className="setting-item">
            <div className="setting-info">
              <div className="setting-label">{label}</div>
              <div className="setting-description">
                {isBound ? '已綁定' : '尚未綁定'}
              </div>
            </div>

            {isBound ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <button
                  type="button"
                  disabled={isPending || cannotUnbind}
                  onClick={() => handleUnbind(provider)}
                  aria-label={`解除綁定 ${label}`}
                  title={cannotUnbind ? '無法解除：此為唯一登入方式' : undefined}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'rgba(239,68,68,0.1)',
                    color: cannotUnbind ? 'var(--co-text-muted)' : 'var(--co-error, #FCA5A5)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: cannotUnbind || isPending ? 'not-allowed' : 'pointer',
                    opacity: cannotUnbind || isPending ? 0.5 : 1,
                    transition: 'opacity 150ms',
                    minWidth: 72,
                  }}
                >
                  {isPending ? '解除中…' : '解除綁定'}
                </button>
                {cannotUnbind && (
                  <span style={{ fontSize: 11, color: 'var(--co-text-muted)', textAlign: 'right', maxWidth: 160 }}>
                    此為唯一登入方式，無法解除
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleBind(provider)}
                aria-label={`綁定 ${label}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.4)',
                  background: 'rgba(99,102,241,0.1)',
                  color: 'var(--co-indigo-200, #C7D2FE)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                  minWidth: 72,
                }}
              >
                綁定帳號
              </button>
            )}
          </div>
        );
      })}
    </>
  );
};

// ─── Main Settings component ──────────────────────────────────────────────────

const Settings = () => {
  const { config, togglePanel } = useTheme();
  const theme = config.panel;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">設定</h1>
        
        <div className="settings-section">
          <h2 className="section-title">外觀</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">主題模式</div>
              <div className="setting-description">選擇淺色或深色主題</div>
            </div>
            
            <div className="theme-options">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  if (theme === 'dark') {
                    togglePanel();
                  }
                }}
              >
                <div className="theme-preview light">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-bar"></div>
                    <div className="preview-bar short"></div>
                  </div>
                </div>
                <span>淺色</span>
              </button>
              
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  if (theme === 'light') {
                    togglePanel();
                  }
                }}
              >
                <div className="theme-preview dark">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-bar"></div>
                    <div className="preview-bar short"></div>
                  </div>
                </div>
                <span>深色</span>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">通知</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">桌面通知</div>
              <div className="setting-description">接收新訊息的桌面通知</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">訊息音效</div>
              <div className="setting-description">新訊息提示音</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">隱私</h2>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">已讀狀態</div>
              <div className="setting-description">讓其他人看到你的已讀狀態</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">線上狀態</div>
              <div className="setting-description">顯示你的線上狀態</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* ── 登入方式 / 綁定帳號 ── */}
        <div className="settings-section">
          <h2 className="section-title">登入方式 / 綁定帳號</h2>
          <p className="setting-description" style={{ marginBottom: 16 }}>
            綁定社群帳號後，可直接使用 Google 或 LINE 登入。若需解除，請確保還有其他登入方式。
          </p>
          <LinkedAccounts />
        </div>
      </div>
    </div>
  );
};

export default Settings;

