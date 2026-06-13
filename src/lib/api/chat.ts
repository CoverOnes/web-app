import http from './http';
import type { Room, Message, Member } from '../../types';
import { validateMessage, validateRoomName, validateUserId, validateRoomId } from '../utils/validation';

// ── ChatRoomsResult ──────────────────────────────────────────────────────────
// The http response interceptor (src/lib/api/http.ts:116-118) unwraps the
// backend envelope { success, data, cursor, has_more } → inner data array.
// Callers must NOT check `.success` — they receive the unwrapped payload
// directly; errors surface as thrown axios exceptions (try/catch).
//
// MVP tradeoff: cursor/has_more are lost by the interceptor unwrap. The chat
// list does not paginate beyond the initial 50-room fetch for MVP. A future
// fix should either bypass the interceptor for paginated endpoints or use a
// separate axios instance that preserves the full envelope.
export interface ChatRoomsResult {
  rooms: Room[];
  /** Opaque cursor for the next page. Empty string = no next page (MVP: always ''). */
  cursor: string;
  /** Whether more pages exist (MVP: always false until pagination is restored). */
  hasMore: boolean;
}

/**
 * 聊天室 API
 *
 * Convention: all methods return the unwrapped inner payload (matching how
 * src/lib/api/coverones.ts calls the same http client). Errors throw axios
 * exceptions — callers MUST use try/catch, not `.success` checks.
 */
export const chatApi = {
  /**
   * 獲取用戶聊天室列表
   *
   * Returns rooms array directly. cursor/hasMore are unavailable at MVP
   * because the response interceptor strips the pagination envelope.
   */
  async getRooms(userId: string, limit = 10, cursor = ''): Promise<ChatRoomsResult> {
    validateUserId(userId);
    const rooms = await http.get<Room[]>('/api/chat/v1/rooms', {
      params: { user_id: userId, limit, cursor },
    }).then((r) => r.data);
    return {
      rooms: Array.isArray(rooms) ? rooms : [],
      cursor: '',    // TODO: restore when interceptor is fixed to preserve envelope
      hasMore: false, // TODO: restore when interceptor is fixed to preserve envelope
    };
  },

  /**
   * 創建聊天室
   */
  async createRoom(data: {
    name: string;
    type: 'direct' | 'group';
    owner_id: string;
    members: Member[];
  }): Promise<Room> {
    validateRoomName(data.name);
    validateUserId(data.owner_id);
    return http.post<Room>('/api/chat/v1/rooms', data).then((r) => r.data);
  },

  /**
   * 獲取聊天室訊息
   */
  async getMessages(
    roomId: string,
    userId: string,
    limit = 20,
    cursor = ''
  ): Promise<Message[]> {
    validateRoomId(roomId);
    validateUserId(userId);
    const data = await http.get<Message[]>('/api/chat/v1/messages', {
      params: { room_id: roomId, user_id: userId, limit, cursor },
    }).then((r) => r.data);
    return Array.isArray(data) ? data : [];
  },

  /**
   * 發送訊息
   */
  async sendMessage(data: {
    room_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'system';
  }): Promise<Message> {
    validateRoomId(data.room_id);
    validateUserId(data.sender_id);
    validateMessage(data.content);
    return http.post<Message>('/api/chat/v1/messages', data).then((r) => r.data);
  },

  /**
   * 標記訊息為已讀
   */
  async markAsRead(roomId: string, userId: string, messageId?: string): Promise<void> {
    validateRoomId(roomId);
    validateUserId(userId);
    await http.post('/api/chat/v1/messages/read', {
      room_id: roomId,
      user_id: userId,
      message_id: messageId,
    });
  },

  /**
   * 添加聊天室成員
   */
  async addMember(roomId: string, userId: string): Promise<void> {
    validateRoomId(roomId);
    validateUserId(userId);
    await http.post(`/api/chat/v1/rooms/${roomId}/members`, { user_id: userId });
  },

  /**
   * 移除聊天室成員
   */
  async removeMember(roomId: string, userId: string): Promise<void> {
    validateRoomId(roomId);
    validateUserId(userId);
    await http.delete(`/api/chat/v1/rooms/${roomId}/members/${userId}`);
  },
};

export default chatApi;

