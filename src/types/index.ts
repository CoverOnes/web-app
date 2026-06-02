// 用戶類型
export interface User {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

// Person type (matches design system persona shape)
export interface Person {
  id: string;
  name: string;     // en name
  zh?: string;      // Chinese display name
  status: 'online' | 'away' | 'offline';
  color?: [string, string]; // gradient colors [from, to]
}

// 成員類型
export interface Member {
  user_id: string;
  role: 'admin' | 'member';
}

// 聊天室類型
export interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group';
  owner_id: string;
  members: Member[];
  created_at: number;
  updated_at?: number;
  last_message?: string;
  last_message_time?: number;
  unread_count?: number;
  isTemporary?: boolean;
  targetContactId?: string;
  connectionTimeout?: boolean;
}

// Message status type
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

// 消息類型
export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'system';
  created_at: number;
  updated_at?: number;
  read_by?: string[];
  status?: MessageStatus;
}

// API 回應類型
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  cursor?: string;
  next_cursor?: string;
  has_more?: boolean;
}

// SSE 事件類型
export interface SSEMessage {
  type: 'connected' | 'ping' | 'message' | 'error';
  data?: unknown;
}
