import http from './http';

export interface UploadedFile {
  file_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  status: string;
}

export interface AttachmentDownloadUrl {
  url: string;
}

/**
 * Upload a file via POST /api/file/v1/files (multipart).
 * axios sets the Content-Type boundary automatically when FormData is passed.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await http.post<UploadedFile>('/api/file/v1/files', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
