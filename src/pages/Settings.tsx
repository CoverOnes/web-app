import { useTheme } from '../hooks/useTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api/coverones';
import type { OAuthProvider, OAuthIdentity } from '../lib/api/coverones';
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

  const { data: identities, isLoading, isError } = useQuery<OAuthIdentity[]>({
    queryKey: ['me', 'identities'],
    queryFn: () => authApi.listIdentities(),
  });

  const unbind = useMutation<unknown, Error, OAuthProvider>({
    mutationFn: (provider) => authApi.unbindIdentity(provider) as Promise<unknown>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'identities'] });
    },
  });

  const boundProviders = new Set((identities ?? []).map((id) => id.provider));

  const handleUnbind = (provider: OAuthProvider) => {
    if ((identities ?? []).length <= 1) {
      // Guard: cannot unbind the last login method
      return;
    }
    unbind.mutate(provider);
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
          <div className="setting-description" style={{ color: '#FCA5A5' }}>
            無法載入登入方式，請重新整理頁面。
          </div>
        </div>
      </div>
    );
  }

  const isLastMethod = (identities ?? []).length <= 1;

  return (
    <>
      {PROVIDERS.map((provider) => {
        const isBound = boundProviders.has(provider);
        const label = PROVIDER_LABEL[provider];
        const isPending = unbind.isPending && unbind.variables === provider;

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
                  disabled={isPending || isLastMethod}
                  onClick={() => handleUnbind(provider)}
                  aria-label={`解除綁定 ${label}`}
                  title={isLastMethod ? '無法解除最後一個登入方式' : undefined}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'rgba(239,68,68,0.1)',
                    color: isLastMethod ? 'var(--co-text-muted)' : '#FCA5A5',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: isLastMethod || isPending ? 'not-allowed' : 'pointer',
                    opacity: isLastMethod || isPending ? 0.5 : 1,
                    transition: 'opacity 150ms',
                    minWidth: 72,
                  }}
                >
                  {isPending ? '解除中…' : '解除綁定'}
                </button>
                {isLastMethod && (
                  <span style={{ fontSize: 11, color: 'var(--co-text-muted)', textAlign: 'right', maxWidth: 140 }}>
                    此為唯一登入方式，無法解除
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => authApi.bindIdentity(provider)}
                aria-label={`綁定 ${label}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.4)',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#C7D2FE',
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

