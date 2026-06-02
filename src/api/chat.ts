import http from './http';
import type { Room, Message, ApiResponse, Member } from '../types';
import { validateMessage, validateRoomName, validateUserId, validateRoomId } from '../utils/validation';

/**
 * 聊天室 API
 */
export const chatApi = {
  /**
   * 獲取用戶聊天室列表
   */
  async getRooms(userId: string, limit = 10, cursor = ''): Promise<ApiResponse<Room[]>> {
    validateUserId(userId);
    const response = await http.get('/rooms', {
      params: { user_id: userId, limit, cursor },
    });
    return response.data;
  },

  /**
   * 創建聊天室
   */
  async createRoom(data: {
    name: string;
    type: 'direct' | 'group';
    owner_id: string;
    members: Member[];
  }): Promise<ApiResponse<Room>> {
    validateRoomName(data.name);
    validateUserId(data.owner_id);
    const response = await http.post('/rooms', data);
    return response.data;
  },

  /**
   * 獲取聊天室訊息
   */
  async getMessages(
    roomId: string,
    userId: string,
    limit = 20,
    cursor = ''
  ): Promise<ApiResponse<Message[]>> {
    validateRoomId(roomId);
    validateUserId(userId);
    const response = await http.get('/messages', {
      params: { room_id: roomId, user_id: userId, limit, cursor },
    });
    return response.data;
  },

  /**
   * 發送訊息
   */
  async sendMessage(data: {
    room_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'system';
  }): Promise<ApiResponse<Message>> {
    validateRoomId(data.room_id);
    validateUserId(data.sender_id);
    validateMessage(data.content);
    const response = await http.post('/messages', data);
    return response.data;
  },

  /**
   * 標記訊息為已讀
   */
  async markAsRead(roomId: string, userId: string, messageId?: string): Promise<ApiResponse> {
    validateRoomId(roomId);
    validateUserId(userId);
    const response = await http.post('/messages/read', {
      room_id: roomId,
      user_id: userId,
      message_id: messageId,
    });
    return response.data;
  },

  /**
   * 添加聊天室成員
   */
  async addMember(roomId: string, userId: string): Promise<ApiResponse> {
    validateRoomId(roomId);
    validateUserId(userId);
    const response = await http.post(`/rooms/${roomId}/members`, {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * 移除聊天室成員
   */
  async removeMember(roomId: string, userId: string): Promise<ApiResponse> {
    validateRoomId(roomId);
    validateUserId(userId);
    const response = await http.delete(`/rooms/${roomId}/members/${userId}`);
    return response.data;
  },
};

export default chatApi;

