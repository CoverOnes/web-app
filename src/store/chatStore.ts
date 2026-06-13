import { create } from 'zustand';
import type { Room, Message } from '../types';

interface ChatState {
  // 聊天室列表
  rooms: Room[];
  roomsLoaded: boolean; // 標記 rooms 是否已從後端載入
  setRooms: (rooms: Room[] | ((prevRooms: Room[]) => Room[])) => void;
  setRoomsLoaded: (loaded: boolean) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;

  // 當前選中的聊天室
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;

  // 彈跳聊天視窗（像 Facebook Messenger）
  openPopups: Room[];
  openChatPopup: (room: Room) => void;
  closeChatPopup: (roomId: string) => void;
  minimizeChatPopup: (roomId: string, minimized: boolean) => void;
  minimizedPopups: Record<string, boolean>;

  // 訊息歷史 (按房間 ID 分組)
  messageHistory: Record<string, Message[]>;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  prependMessages: (roomId: string, messages: Message[]) => void;

  // 訊息游標 (用於分頁)
  messagesCursor: Record<string, string>;
  setMessagesCursor: (roomId: string, cursor: string) => void;

  // 是否還有更多訊息
  hasMoreMessages: Record<string, boolean>;
  setHasMoreMessages: (roomId: string, hasMore: boolean) => void;

  // 清空狀態
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 初始狀態
  rooms: [],
  roomsLoaded: false,
  currentRoom: null,
  messageHistory: {},
  messagesCursor: {},
  hasMoreMessages: {},
  openPopups: [],
  minimizedPopups: {},

  // Actions
  setRooms: (rooms) => set((state) => ({
    rooms: typeof rooms === 'function' ? rooms(state.rooms) : rooms
  })),

  setRoomsLoaded: (loaded) => set({ roomsLoaded: loaded }),

  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms, room],
  })),

  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.id === roomId ? { ...room, ...updates } : room
    ),
  })),

  setCurrentRoom: (room) => set({ currentRoom: room }),

  // 彈跳視窗管理
  openChatPopup: (room) => set((state) => {
    // 如果已經打開，不要重複添加，只需要取消最小化
    if (state.openPopups.some(r => r.id === room.id)) {
      return {
        minimizedPopups: { ...state.minimizedPopups, [room.id]: false }
      };
    }
    // 最多同時打開 3 個聊天視窗
    const newPopups = state.openPopups.length >= 3 
      ? [...state.openPopups.slice(1), room]
      : [...state.openPopups, room];
    return { openPopups: newPopups };
  }),

  closeChatPopup: (roomId) => set((state) => ({
    openPopups: state.openPopups.filter(r => r.id !== roomId),
    minimizedPopups: { ...state.minimizedPopups, [roomId]: false }
  })),

  minimizeChatPopup: (roomId, minimized) => set((state) => ({
    minimizedPopups: { ...state.minimizedPopups, [roomId]: minimized }
  })),

  setMessages: (roomId, messages) => set((state) => ({
    messageHistory: {
      ...state.messageHistory,
      [roomId]: messages,
    },
  })),

  addMessage: (roomId, message) => set((state) => {
    const existingMessages = state.messageHistory[roomId] || [];
    // 檢查是否已存在（避免重複）
    if (existingMessages.some((m) => m.id === message.id)) {
      return state;
    }
    return {
      messageHistory: {
        ...state.messageHistory,
        [roomId]: [...existingMessages, message],
      },
    };
  }),

  prependMessages: (roomId, messages) => set((state) => {
    const existingMessages = state.messageHistory[roomId] || [];
    return {
      messageHistory: {
        ...state.messageHistory,
        [roomId]: [...messages, ...existingMessages],
      },
    };
  }),

  setMessagesCursor: (roomId, cursor) => set((state) => ({
    messagesCursor: {
      ...state.messagesCursor,
      [roomId]: cursor,
    },
  })),

  setHasMoreMessages: (roomId, hasMore) => set((state) => ({
    hasMoreMessages: {
      ...state.hasMoreMessages,
      [roomId]: hasMore,
    },
  })),

  clearChat: () => set({
    rooms: [],
    roomsLoaded: false,
    currentRoom: null,
    messageHistory: {},
    messagesCursor: {},
    hasMoreMessages: {},
    openPopups: [],
    minimizedPopups: {},
  }),
}));

export default useChatStore;
