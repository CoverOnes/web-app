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

/**
 * GET /api/chat/v1/messages/:messageId/attachment/download-url
 * Returns a short-lived pre-signed download URL for the attachment.
 */
export async function getAttachmentDownloadUrl(messageId: string): Promise<AttachmentDownloadUrl> {
  const res = await http.get<AttachmentDownloadUrl>(
    `/api/chat/v1/messages/${messageId}/attachment/download-url`
  );
  return res.data;
}
