import http from './http';

export interface UploadedFile {
  file_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  // TODO: narrow to union once gateway contract is stable (e.g. 'pending'|'ready'|'error')
  status: string;
}

export interface AttachmentDownloadUrl {
  url: string;
}

/**
 * Upload a file via POST /api/file/v1/files (multipart/form-data).
 *
 * Do NOT set Content-Type manually — passing FormData lets axios (and the
 * browser's XMLHttpRequest layer) generate the multipart boundary automatically.
 * Setting `Content-Type: multipart/form-data` without a boundary causes the
 * server to reject the request with 400 (boundary missing).
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await http.post<UploadedFile>('/api/file/v1/files', form);
  return res.data;
}

// Chat message IDs are server-generated UUIDs (chat-gateway message_store: uuid.New()).
// Optimistic messages use a `temp_…` id that is not downloadable until the server
// confirms it, so they are correctly rejected here too.
const MESSAGE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/chat/v1/messages/:messageId/attachment/download-url
 * Returns a short-lived pre-signed download URL for the attachment.
 *
 * `messageId` is validated against the UUID format and percent-encoded before
 * being interpolated into the path, so a crafted id (e.g. "../../x" from a
 * compromised backend / SSE payload) cannot inject into the URL path (CWE-22).
 */
export async function getAttachmentDownloadUrl(messageId: string): Promise<AttachmentDownloadUrl> {
  if (!MESSAGE_ID_RE.test(messageId)) {
    throw new Error('invalid messageId');
  }
  const res = await http.get<AttachmentDownloadUrl>(
    `/api/chat/v1/messages/${encodeURIComponent(messageId)}/attachment/download-url`
  );
  return res.data;
}
