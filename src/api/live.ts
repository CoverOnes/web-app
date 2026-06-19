/**
 * live.ts — Avatar Livestream API stubs
 *
 * postAvatarSession: POST /api/avatar/sessions  (wired to real http client)
 * getLiveStreams:    GET  /live/streams          TODO: backend not built yet → returns []
 * endAvatarSession: stub only — backend endpoint TBD
 *
 * Uses the existing authenticated `http` client from lib/api/http.ts so
 * Authorization, request-ID injection and token-refresh all happen automatically.
 */

import { http } from '../lib/api/http';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface LiveStream {
  roomId: string;
  title: string;
  channelName: string;
  channelAvatarUrl: string | null;
  viewerCount: number;
  tags: string[];
  language: string;
  thumbnailUrl: string | null;
  startedAt: string;
}

export interface AvatarSession {
  token: string;
  url: string;
  room: string;
  identity: string;
}

export interface PostAvatarSessionBody {
  title?: string;
  tags?: string[];
  language?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Start an avatar session. The backend allocates a LiveKit room and returns
 * the connection credentials.
 *
 * POST /api/avatar/sessions
 */
export async function postAvatarSession(body: PostAvatarSessionBody): Promise<AvatarSession> {
  const res = await http.post<AvatarSession>('/api/avatar/sessions', body);
  return res.data;
}

/**
 * Fetch the list of active live streams.
 *
 * TODO: backend GET /live/streams is not built yet. Returns [] as a typed stub
 * so the directory UI can render the correct empty-state instead of erroring.
 * Remove this comment and replace the stub with a real http.get() call when
 * the backend ships.
 */
export async function getLiveStreams(): Promise<LiveStream[]> {
  return [];
}

/**
 * End an avatar session (release the LiveKit room).
 *
 * TODO: backend DELETE /api/avatar/sessions/:room is not built yet.
 * This is a no-op stub. Wire up the real call when the backend ships.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub; real implementation pending backend
export async function endAvatarSession(_room: string): Promise<void> {
  // stub — no backend endpoint yet
}
