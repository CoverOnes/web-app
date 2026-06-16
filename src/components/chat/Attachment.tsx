import { useState, useCallback, useRef } from 'react';
import { getAttachmentDownloadUrl } from '../../lib/api/file';
import { Icon } from '../ui/Icon';
import type { MessageAttachment } from '../../types';

interface AttachmentProps {
  messageId: string;
  attachment: MessageAttachment;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sanitize the server-supplied filename before using it as the `download` hint.
 * Drops path separators and control characters (including null bytes) so a
 * crafted original_filename (e.g. "../../x") cannot influence the save path on
 * browsers that honour path segments in the download attribute (CWE-22). Leading
 * dots are stripped and the result is capped to the 255-char filesystem limit.
 */
function sanitizeDownloadFilename(name: string): string {
  let out = '';
  for (const ch of name) {
    // Drop path separators and any control char (code < 0x20 covers the null byte).
    if (ch === '/' || ch === '\\' || ch.charCodeAt(0) < 0x20) continue;
    out += ch;
  }
  return out.replace(/^\.+/, '').slice(0, 255) || 'download';
}

/**
 * Download-tile for file and image attachments.
 *
 * v1 decision (locked): download-only tile, NO inline image preview.
 * The gateway forces Content-Disposition: attachment on the download URL,
 * so inline <img> would be blocked anyway.
 *
 * On click: fetch a short-lived pre-signed URL via
 *   GET /api/chat/v1/messages/:messageId/attachment/download-url
 * then trigger a browser download via <a download>.
 */
const Attachment = ({ messageId, attachment }: AttachmentProps) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref guard prevents concurrent download calls without including `downloading`
  // in useCallback deps (which would recreate the callback on every state toggle).
  const isDownloadingRef = useRef(false);

  const isImage = attachment.file_type.startsWith('image/');
  const IconComp = isImage ? Icon.Image : Icon.File;

  const handleDownload = useCallback(async () => {
    // Use a ref guard (not `downloading` state) to block concurrent calls —
    // this avoids including `downloading` in the deps array, which would cause
    // the callback to be recreated on every state toggle (unnecessary churn).
    if (isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    setDownloading(true);
    setError(null);
    try {
      const { url } = await getAttachmentDownloadUrl(messageId);

      // XSS guard: reject non-http(s) protocols (e.g. javascript:, data:).
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('invalid download url');
      }

      // Trigger browser download without navigating away.
      const a = document.createElement('a');
      a.href = url;
      a.download = sanitizeDownloadFilename(attachment.file_name);
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError('下載失敗，請稍後再試');
      setTimeout(() => setError(null), 4000);
    } finally {
      isDownloadingRef.current = false;
      setDownloading(false);
    }
  }, [messageId, attachment.file_name]);

  return (
    <div style={{ marginTop: 6 }}>
      {error && (
        <div style={{
          marginBottom: 4,
          fontSize: 11,
          color: 'var(--color-red)',
        }}>
          {error}
        </div>
      )}
      <button
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`下載 ${attachment.file_name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: downloading ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: '1px solid var(--color-main-border)',
          borderRadius: 8,
          maxWidth: 320,
          width: '100%',
          cursor: downloading ? 'wait' : 'pointer',
          textAlign: 'left',
          transition: 'background 120ms',
          color: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!downloading) {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            downloading ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)';
        }}
      >
        {/* File type icon */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'var(--color-accent-soft)',
          color: downloading ? 'var(--color-main-text-dim)' : 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 120ms',
        }}>
          <IconComp size={16} />
        </div>

        {/* File name + size */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-main-text)',
          }}>
            {attachment.file_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-main-text-dim)' }}>
            {formatBytes(attachment.file_size)}
            {downloading && ' · 準備下載...'}
          </div>
        </div>

        {/* Download icon */}
        <div style={{
          color: downloading ? 'var(--color-main-text-dim)' : 'var(--color-accent)',
          flexShrink: 0,
          transition: 'color 120ms',
        }}>
          <DownloadIcon size={16} />
        </div>
      </button>
    </div>
  );
};

// Inline download arrow icon (not in shared Icon set yet)
const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default Attachment;
