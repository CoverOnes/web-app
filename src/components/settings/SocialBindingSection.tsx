/**
 * SocialBindingSection — Settings → 社群帳號綁定.
 *
 * Lists the authenticated user's linked social identities (Google / LINE) and
 * lets them bind/unbind. Account-linking happens ONLY here, for an already-
 * authenticated user (social-login contract §2.3–2.7). Binding by authenticated
 * session + provider subject — NEVER by email auto-link.
 *
 * Link flow: POST .../link returns { authorizeUrl }; we then navigate the browser
 * there. The provider redirects back to /settings?oauth_linked=<provider> (or
 * ?oauth_error=identity_taken when the identity is already bound to another user).
 *
 * Unlink flow: DELETE .../:provider. A 409 LAST_LOGIN_METHOD means unlinking would
 * strand the account (sentinel password + only login method) — show guidance,
 * don't unlink.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { identitiesApi, type Identity, type OAuthProvider } from '../../lib/api/coverones';
import { useIdentities, useUnlinkIdentity } from '../../lib/query';

interface ProviderMeta {
  key: OAuthProvider;
  enumKey: Identity['provider'];
  label: string;
}

// The two providers in scope this wave. Order is the render order.
const PROVIDERS: ProviderMeta[] = [
  { key: 'google', enumKey: 'GOOGLE', label: 'Google' },
  { key: 'line', enumKey: 'LINE', label: 'LINE' },
];

type Banner = { kind: 'success' | 'error'; text: string };

export function SocialBindingSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: identities, isLoading, isError, refetch } = useIdentities();
  const unlink = useUnlinkIdentity();

  const [banner, setBanner] = useState<Banner | null>(null);
  // Tracks which provider is mid-link (button shows loading + disables).
  const [linking, setLinking] = useState<OAuthProvider | null>(null);

  // Handle the link-flow return (?oauth_linked=... / ?oauth_error=identity_taken).
  useEffect(() => {
    const linked = searchParams.get('oauth_linked');
    const err = searchParams.get('oauth_error');
    if (!linked && !err) return;

    if (linked) {
      const meta = PROVIDERS.find((p) => p.key === linked);
      setBanner({ kind: 'success', text: `已成功綁定 ${meta?.label ?? linked}。` });
      void refetch();
    } else if (err === 'identity_taken') {
      const prov = searchParams.get('provider');
      const meta = PROVIDERS.find((p) => p.key === prov);
      setBanner({
        kind: 'error',
        text: `此 ${meta?.label ?? '社群'} 帳號已綁定到其他 CoverOnes 帳號，無法重複綁定。`,
      });
    } else {
      setBanner({ kind: 'error', text: '綁定失敗，請稍後再試。' });
    }

    // Clear the query params so a refresh doesn't re-show the banner.
    const next = new URLSearchParams(searchParams);
    next.delete('oauth_linked');
    next.delete('oauth_error');
    next.delete('provider');
    next.delete('email');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, refetch]);

  const linkedByProvider = new Map<Identity['provider'], Identity>(
    (identities ?? []).map((i) => [i.provider, i]),
  );

  const handleLink = async (provider: OAuthProvider) => {
    setBanner(null);
    setLinking(provider);
    try {
      const { authorizeUrl } = await identitiesApi.linkStart(provider);
      window.location.href = authorizeUrl;
    } catch (err) {
      setLinking(null);
      let text = '無法開始綁定，請稍後再試。';
      if (axios.isAxiosError(err)) {
        type ApiError = { error?: { code?: string }; code?: string };
        const data = err.response?.data as ApiError | undefined;
        const code = data?.error?.code ?? data?.code;
        if (code === 'IDENTITY_ALREADY_LINKED_TO_YOU') text = '您已綁定此社群帳號。';
        else if (code === 'OAUTH_NOT_CONFIGURED') text = '此登入方式尚未開放，請稍後再試。';
      }
      setBanner({ kind: 'error', text });
    }
  };

  const handleUnlink = async (provider: OAuthProvider, label: string) => {
    setBanner(null);
    try {
      await unlink.mutateAsync(provider);
      setBanner({ kind: 'success', text: `已解除綁定 ${label}。` });
    } catch (err) {
      let text = '解除綁定失敗，請稍後再試。';
      if (axios.isAxiosError(err)) {
        type ApiError = { error?: { code?: string }; code?: string };
        const data = err.response?.data as ApiError | undefined;
        const code = data?.error?.code ?? data?.code;
        if (code === 'LAST_LOGIN_METHOD') {
          text = '這是您唯一的登入方式，請先設定密碼或綁定其他方式後再解除。';
        } else if (code === 'IDENTITY_NOT_FOUND') {
          text = '找不到此綁定。';
        }
      }
      setBanner({ kind: 'error', text });
    }
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">社群帳號綁定</h2>

      {banner && (
        <div
          role={banner.kind === 'error' ? 'alert' : 'status'}
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 10,
            fontSize: 13,
            background: banner.kind === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${banner.kind === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: banner.kind === 'error' ? 'var(--co-red)' : 'var(--co-green)',
          }}
        >
          {banner.text}
        </div>
      )}

      {isLoading && (
        <div role="status" className="setting-description" style={{ padding: '12px 0' }}>
          載入中…
        </div>
      )}

      {isError && (
        <div role="alert" className="setting-description" style={{ padding: '12px 0', color: 'var(--co-red)' }}>
          無法載入綁定狀態，請稍後再試。
        </div>
      )}

      {!isLoading && !isError &&
        PROVIDERS.map((p) => {
          const linked = linkedByProvider.get(p.enumKey);
          const isUnlinking = unlink.isPending && unlink.variables === p.key;
          const isLinking = linking === p.key;
          return (
            <div className="setting-item" key={p.key}>
              <div className="setting-info">
                <div className="setting-label">{p.label}</div>
                <div className="setting-description">
                  {linked
                    ? `已綁定${linked.email ? ` · ${linked.email}` : ''}`
                    : '尚未綁定'}
                </div>
              </div>
              {linked ? (
                <button
                  type="button"
                  onClick={() => handleUnlink(p.key, p.label)}
                  disabled={isUnlinking}
                  aria-label={`解除綁定 ${p.label}`}
                  style={bindingButtonStyle('unlink', isUnlinking)}
                >
                  {isUnlinking ? '處理中…' : '解除綁定'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLink(p.key)}
                  disabled={isLinking}
                  aria-label={`綁定 ${p.label}`}
                  style={bindingButtonStyle('link', isLinking)}
                >
                  {isLinking ? '前往綁定…' : '綁定'}
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}

function bindingButtonStyle(variant: 'link' | 'unlink', busy: boolean): React.CSSProperties {
  const isLink = variant === 'link';
  return {
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.7 : 1,
    border: isLink ? 'none' : '1px solid var(--co-line-strong)',
    color: isLink ? 'var(--co-text-on-accent)' : 'var(--co-text-dim)',
    background: isLink
      ? 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))'
      : 'transparent',
    transition: 'opacity 150ms, border-color 150ms',
  };
}

export default SocialBindingSection;
