import { useState, useRef, useEffect, useCallback } from 'react';
import { validateMessage } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';
import { Icon } from '../ui/Icon';
import { uploadFile } from '../../lib/api/file';
import { getApiErrorCode } from '../../lib/api/http';
import type { MessageAttachment } from '../../types';

// Client-side size limit: 10 MiB (matches gateway limit)
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Allowed MIME types for generic file attachment (Paperclip).
// image/svg+xml is intentionally excluded — SVG can carry embedded scripts (XSS vector).
const ACCEPTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
].join(',');

// Allowed MIME types for the Image button — images only (no SVG for XSS reasons).
const ACCEPTED_IMAGE_MIME = 'image/jpeg,image/png,image/gif,image/webp';

interface PendingAttachment {
  file: File;
  uploadedId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  messageType: 'file' | 'image';
}

interface ComposerProps {
  onSend: (content: string, attachment?: MessageAttachment, type?: 'file' | 'image') => void;
  roomTitle: string;
  disabled?: boolean;
}

const Composer = ({ onSend, roomTitle, disabled = false }: ComposerProps) => {
  const [val, setVal] = useState('');
  const [focus, setFocus] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Two separate hidden inputs: one for generic files (Paperclip), one image-only (Image button).
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
  }, [val]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleFileSelected = useCallback(async (file: File) => {
    // Client-side size guard
    if (file.size > MAX_FILE_BYTES) {
      showError('檔案超過 10 MB 限制，請選擇較小的檔案');
      return;
    }

    const messageType: 'file' | 'image' = file.type.startsWith('image/') ? 'image' : 'file';

    setUploading(true);
    setError('');
    try {
      const result = await uploadFile(file);
      setPending({
        file,
        uploadedId: result.file_id,
        fileName: result.original_filename,
        fileSize: result.size_bytes,
        fileType: result.content_type,
        messageType,
      });
    } catch (err: unknown) {
      // Use shared helper to read the canonical error code from the backend envelope.
      const code = getApiErrorCode(err);
      const httpStatus = (err as { response?: { status?: number } })?.response?.status;
      if (httpStatus === 413 || code === 'FILE_TOO_LARGE') {
        showError('檔案超過伺服器大小限制');
      } else if (httpStatus === 415 || code === 'UNSUPPORTED_MEDIA_TYPE') {
        showError('不支援此檔案類型');
      } else {
        showError('上傳失敗，請稍後再試');
      }
    } finally {
      setUploading(false);
      // Reset both inputs so the same file can be re-selected after removal.
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileSelected(file);
  }, [handleFileSelected]);

  // Paperclip: opens the generic file picker (all allowed types).
  const handleAttachClick = () => {
    if (uploading || disabled) return;
    fileInputRef.current?.click();
  };

  // Image button: opens an image-only picker (no SVG).
  const handleImageClick = () => {
    if (uploading || disabled) return;
    imageInputRef.current?.click();
  };

  const handleSend = () => {
    const hasFile = pending !== null;
    const trimmed = val.trim();
    if ((!trimmed && !hasFile) || isSendingRef.current || disabled || uploading) return;
    isSendingRef.current = true;

    try {
      if (hasFile && pending) {
        const attachment: MessageAttachment = {
          file_id: pending.uploadedId,
          file_name: pending.fileName,
          file_size: pending.fileSize,
          file_type: pending.fileType,
        };
        // Sanitize the optional caption the same way text messages are sanitized,
        // falling back to the (also-sanitized) file name when no (or
        // empty-after-sanitize) caption was typed. sanitizeInput strips control
        // chars from the server-supplied filename too, and validateMessage then
        // enforces the same 10 000-char / null-byte cap, so neither an oversized
        // caption nor a hostile filename can be relayed unbounded to room members.
        const caption = (trimmed && sanitizeInput(trimmed)) || sanitizeInput(pending.fileName);
        validateMessage(caption);
        onSend(caption, attachment, pending.messageType);
        setPending(null);
        setVal('');
      } else {
        const sanitized = sanitizeInput(trimmed);
        validateMessage(sanitized);
        setVal('');
        setError('');
        onSend(sanitized);
      }
      setTimeout(() => { isSendingRef.current = false; }, 300);
    } catch (err) {
      isSendingRef.current = false;
      if (err instanceof Error) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = val.trim().length > 0 || pending !== null;

  return (
    <div style={{
      padding: '10px 24px 18px 24px',
      borderTop: '1px solid var(--color-main-border)',
      flexShrink: 0,
      background: 'var(--color-main-bg)',
    }}>
      {error && (
        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-red)' }}>{error}</div>
      )}

      {/* Pending attachment pill */}
      {pending && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 8,
          padding: '8px 10px',
          background: 'var(--color-input-bg)',
          border: '1px solid var(--color-main-border)',
          borderRadius: 8,
          fontSize: 12,
          alignItems: 'center',
        }}>
          {pending.messageType === 'image'
            ? <Icon.Image size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            : <Icon.File size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          }
          <span style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-main-text)',
          }}>
            {pending.fileName}
          </span>
          <button
            onClick={() => setPending(null)}
            aria-label="移除附件"
            style={{
              color: 'var(--color-main-text-dim)',
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Icon.X size={14} />
          </button>
        </div>
      )}

      {/* Upload progress indicator */}
      {uploading && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 8,
          padding: '8px 10px',
          background: 'var(--color-input-bg)',
          border: '1px solid var(--color-main-border)',
          borderRadius: 8,
          fontSize: 12,
          alignItems: 'center',
          color: 'var(--color-main-text-dim)',
        }}>
          <Icon.Paperclip size={14} style={{ flexShrink: 0 }} />
          <span>上傳中...</span>
        </div>
      )}

      {/* Hidden file inputs — generic (Paperclip) and image-only (Image button) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_MIME}
        style={{ display: 'none' }}
        aria-hidden="true"
        onChange={handleInputChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_MIME}
        style={{ display: 'none' }}
        aria-hidden="true"
        onChange={handleInputChange}
      />

      {/* Composer box */}
      <div style={{
        background: 'var(--color-input-bg)',
        border: `1px solid ${focus ? 'var(--color-accent)' : 'var(--color-main-border)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
        boxShadow: focus ? '0 0 0 3px var(--color-accent-soft)' : 'none',
      }}>
        <textarea
          ref={textareaRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={`傳訊息到 ${roomTitle}...`}
          aria-label="輸入訊息"
          disabled={disabled || uploading}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            color: 'var(--color-main-text)',
            resize: 'none',
            minHeight: 22,
            maxHeight: 140,
            fontSize: 14,
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: 'inherit',
            lineHeight: 1.5,
            display: 'block',
          }}
        />

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 8,
        }}>
          {/* Paperclip — triggers file input (any allowed type) */}
          <button
            aria-label="附件"
            onClick={handleAttachClick}
            disabled={uploading || disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: uploading ? 'var(--color-main-text-dim)' : 'var(--color-main-text-dim)',
              background: 'transparent',
              border: 'none',
              cursor: uploading || disabled ? 'default' : 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => {
              if (!uploading && !disabled) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)';
              }
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon.Paperclip size={16} />
          </button>

          {/* Image — triggers image-only picker (no SVG) */}
          <button
            aria-label="圖片"
            onClick={handleImageClick}
            disabled={uploading || disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-main-text-dim)',
              background: 'transparent',
              border: 'none',
              cursor: uploading || disabled ? 'default' : 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => {
              if (!uploading && !disabled) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)';
              }
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon.Image size={16} />
          </button>

          {/* Smile — placeholder, no upload action */}
          <button
            aria-label="表情符號"
            disabled={disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-main-text-dim)',
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)';
              }
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon.Smile size={16} />
          </button>

          {/* Encryption badge center */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color: 'var(--color-main-text-dim)',
            fontSize: 11,
          }}>
            <Icon.LockSmall size={10} style={{ color: 'var(--color-cyan)' }} />
            <span>AES-256-GCM · end-to-end encrypted</span>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasContent || disabled || uploading}
            aria-label="傳送訊息"
            style={{
              height: 30,
              padding: '0 12px',
              borderRadius: 8,
              background: (hasContent && !uploading) ? 'var(--color-accent)' : 'rgba(148,163,184,0.15)',
              color: (hasContent && !uploading) ? '#fff' : 'var(--color-main-text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: (hasContent && !uploading) ? 'pointer' : 'default',
              transition: 'background 150ms ease-out',
            }}
          >
            <Icon.Send size={14} />
            傳送
          </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
